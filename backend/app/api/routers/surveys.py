from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import BaseModel
from typing import Optional, List
import uuid as uuid_module
from jose import jwt
from app.core.database import get_db
from app.models.survey import Survey
from app.models.question import Question
from app.models.option import Option
from app.models.answer import Answer
from app.core.config import settings

router = APIRouter(prefix="/surveys", tags=["Surveys"])
security = HTTPBearer()

# =====================================================
# Вспомогательные функции
# =====================================================


def validate_uuid(value: str) -> uuid_module.UUID:
    """Валидация UUID формата. Возвращает UUID или raises HTTPException 400."""
    try:
        return uuid_module.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail=f"Invalid UUID format: {value}")


def get_current_user_id(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """Получение user_id из JWT токена."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =====================================================
# Схемы (Pydantic)
# =====================================================


class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None


class SurveyResponse(BaseModel):
    id: str
    public_id: Optional[str]
    title: str
    description: Optional[str]
    status: str
    created_at: str


class QuestionCreate(BaseModel):
    text: str
    type: str
    options: Optional[List[str]] = None


class SubmitAnswerRequest(BaseModel):
    answers: dict


# =====================================================
# Эндпоинты для опросов (требуют авторизацию)
# =====================================================


@router.post("/", response_model=SurveyResponse)
async def create_survey(
    survey_data: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Создание нового опроса."""
    try:
        author_uuid = validate_uuid(user_id)
        new_survey = Survey(
            public_id=uuid_module.uuid4().hex[:10],
            author_id=author_uuid,
            title=survey_data.title,
            description=survey_data.description,
            status="draft"
        )
        db.add(new_survey)
        await db.commit()
        await db.refresh(new_survey)
        return SurveyResponse(
            id=str(new_survey.id),
            public_id=new_survey.public_id,
            title=new_survey.title,
            description=new_survey.description,
            status=new_survey.status,
            created_at=new_survey.created_at.isoformat()
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/")
async def get_surveys(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Получить список опросов текущего пользователя."""
    try:
        user_uuid = validate_uuid(user_id)
        result = await db.execute(select(Survey).where(Survey.author_id == user_uuid))
        surveys = result.scalars().all()
        return [
            {
                "id": str(s.id),
                "public_id": s.public_id,
                "title": s.title,
                "status": s.status,
                "created_at": s.created_at.isoformat()
            }
            for s in surveys
        ]
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{survey_id}")
async def get_survey(
    survey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Получить опрос с вопросами."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        # Получаем вопросы
        questions_result = await db.execute(
            select(Question).where(Question.survey_id == survey_uuid)
            .order_by(Question.order_index)
        )
        questions = questions_result.scalars().all()

        questions_data = []
        for q in questions:
            if q.type == "single_choice":
                options_result = await db.execute(
                    select(Option).where(Option.question_id == q.id)
                    .order_by(Option.order_index)
                )
                options = options_result.scalars().all()
                questions_data.append({
                    "id": str(q.id),
                    "text": q.text,
                    "type": q.type,
                    "order_index": q.order_index,
                    "options": [{"id": str(o.id), "text": o.text} for o in options]
                })
            else:
                questions_data.append({
                    "id": str(q.id),
                    "text": q.text,
                    "type": q.type,
                    "order_index": q.order_index
                })

        return {
            "id": str(survey.id),
            "public_id": survey.public_id,
            "title": survey.title,
            "description": survey.description,
            "status": survey.status,
            "created_at": survey.created_at.isoformat(),
            "questions": questions_data
        }
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{survey_id}")
async def update_survey(
    survey_id: str,
    survey_data: SurveyCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Редактирование опроса."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        if survey.status != "draft":
            raise HTTPException(status_code=400, detail="Cannot edit published survey")

        survey.title = survey_data.title
        survey.description = survey_data.description
        await db.commit()
        return {"message": "Survey updated"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{survey_id}")
async def delete_survey(
    survey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Удаление опроса."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        await db.delete(survey)
        await db.commit()
        return {"message": "Survey deleted"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{survey_id}/publish")
async def publish_survey(
    survey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Публикация опроса."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        if survey.status == "published":
            raise HTTPException(status_code=400, detail="Survey already published")

        await db.execute(
            update(Survey)
            .where(Survey.id == survey_uuid)
            .values(status="published", published_at=func.now())
        )
        await db.commit()

        result = await db.execute(select(Survey).where(Survey.id == survey_uuid))
        updated_survey = result.scalar_one()
        return {
            "message": "Survey published successfully",
            "public_url": f"{settings.BASE_URL}/survey/{updated_survey.public_id}"
        }
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{survey_id}/unpublish")
async def unpublish_survey(
    survey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Снятие опроса с публикации."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        if survey.status == "draft":
            raise HTTPException(status_code=400, detail="Survey is already a draft")

        await db.execute(
            update(Survey)
            .where(Survey.id == survey_uuid)
            .values(status="draft", published_at=None)
        )
        await db.commit()
        return {"message": "Survey unpublished successfully"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


# =====================================================
# Публичные эндпоинты (без авторизации)
# =====================================================


@router.get("/public/{public_id}")
async def get_public_survey(
    public_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить опубликованный опрос по public_id (без авторизации)."""
    try:
        result = await db.execute(select(Survey).where(
            Survey.public_id == public_id,
            Survey.status == "published"
        ))
        survey = result.scalar_one_or_none()

        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        questions_result = await db.execute(
            select(Question).where(Question.survey_id == survey.id)
            .order_by(Question.order_index)
        )
        questions = questions_result.scalars().all()

        questions_data = []
        for q in questions:
            if q.type == "single_choice":
                options_result = await db.execute(
                    select(Option).where(Option.question_id == q.id)
                    .order_by(Option.order_index)
                )
                options = options_result.scalars().all()
                questions_data.append({
                    "id": str(q.id),
                    "text": q.text,
                    "type": "single_choice",
                    "options": [{"id": str(o.id), "text": o.text} for o in options]
                })
            else:
                questions_data.append({
                    "id": str(q.id),
                    "text": q.text,
                    "type": "text"
                })

        return {
            "id": str(survey.id),
            "public_id": survey.public_id,
            "title": survey.title,
            "description": survey.description,
            "status": survey.status,
            "created_at": survey.created_at.isoformat(),
            "questions": questions_data
        }
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/public/{public_id}/responses")
async def submit_public_response(
    public_id: str,
    data: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Сохранить ответы на опрос (без авторизации).

    Для single_choice вопросов в answers передаётся UUID опции (option.id).
    Для text вопросов в answers передаётся строка с ответом.
    """
    try:
        result = await db.execute(select(Survey).where(
            Survey.public_id == public_id,
            Survey.status == "published"
        ))
        survey = result.scalar_one_or_none()

        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        respondent_session_id = uuid_module.uuid4()

        for question_id_str, answer_value in data.answers.items():
            try:
                question_id = uuid_module.UUID(question_id_str)
            except (ValueError, AttributeError):
                continue

            q_result = await db.execute(
                select(Question).where(
                    Question.id == question_id,
                    Question.survey_id == survey.id
                )
            )
            question = q_result.scalar_one_or_none()
            if not question:
                continue

            selected_option_id = None
            text_answer = None

            if question.type == "single_choice":
                # answer_value — это UUID опции
                try:
                    selected_option_id = uuid_module.UUID(answer_value)
                    # Проверяем, что опция существует и принадлежит этому вопросу
                    opt_result = await db.execute(
                        select(Option).where(
                            Option.id == selected_option_id,
                            Option.question_id == question_id
                        )
                    )
                    option = opt_result.scalar_one_or_none()
                    if not option:
                        # Опция не найдена, сохраняем как текст
                        text_answer = answer_value
                        selected_option_id = None
                except (ValueError, AttributeError):
                    # Если не UUID, сохраняем как текст
                    text_answer = answer_value
            else:
                text_answer = answer_value

            new_answer = Answer(
                survey_id=survey.id,
                question_id=question_id,
                respondent_session_id=respondent_session_id,
                selected_option_id=selected_option_id,
                text_answer=text_answer
            )
            db.add(new_answer)

        await db.commit()
        return {"message": "Responses submitted successfully"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{survey_id}/responses")
async def get_survey_responses(
    survey_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Получить все ответы на опрос."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")

        answers_result = await db.execute(
            select(Answer).where(Answer.survey_id == survey_uuid)
        )
        answers = answers_result.scalars().all()

        # Возвращаем плоский список с текстом ответа (не ID)
        responses = []
        for answer in answers:
            answer_text = None
            if answer.text_answer:
                answer_text = answer.text_answer
            elif answer.selected_option_id:
                option_result = await db.execute(
                    select(Option).where(Option.id == answer.selected_option_id)
                )
                option = option_result.scalar_one_or_none()
                answer_text = option.text if option else None

            responses.append({
                "question_id": str(answer.question_id),
                "respondent_session_id": str(answer.respondent_session_id),
                "answer": answer_text,
                "created_at": answer.created_at.isoformat() if answer.created_at else None
            })

        return responses
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Internal server error")


# =====================================================
# Эндпоинты для вопросов (требуют авторизацию)
# =====================================================


@router.post("/{survey_id}/questions", response_model=dict)
async def add_question(
    survey_id: str,
    question_data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Добавление вопроса в опрос."""
    try:
        survey_uuid = validate_uuid(survey_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(select(Survey).where(
            Survey.id == survey_uuid,
            Survey.author_id == user_uuid
        ))
        survey = result.scalar_one_or_none()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        if survey.status != "draft":
            raise HTTPException(status_code=400, detail="Cannot add questions to published survey")

        max_order_result = await db.execute(
            select(Question.order_index).where(Question.survey_id == survey_uuid)
            .order_by(Question.order_index.desc())
            .limit(1)
        )
        max_order = max_order_result.scalar_one_or_none()
        next_order = (max_order or 0) + 1

        new_question = Question(
            survey_id=survey_uuid,
            text=question_data.text,
            type=question_data.type,
            order_index=next_order
        )
        db.add(new_question)
        await db.flush()

        if question_data.type == "single_choice" and question_data.options:
            for idx, option_text in enumerate(question_data.options):
                new_option = Option(
                    question_id=new_question.id,
                    text=option_text,
                    order_index=idx + 1
                )
                db.add(new_option)

        await db.commit()
        await db.refresh(new_question)

        return {
            "message": "Question added",
            "question_id": str(new_question.id),
            "question": {
                "id": str(new_question.id),
                "text": new_question.text,
                "type": new_question.type,
                "order_index": new_question.order_index
            }
        }
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/questions/{question_id}")
async def update_question(
    question_id: str,
    question_data: dict,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Редактирование вопроса."""
    try:
        question_uuid = validate_uuid(question_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(
            select(Question, Survey).join(
                Survey, Question.survey_id == Survey.id
            ).where(
                Question.id == question_uuid,
                Survey.author_id == user_uuid
            )
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Question not found")

        question = row[0]
        question.text = question_data.get("text", question.text)
        await db.commit()
        return {"message": "Question updated"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Удаление вопроса."""
    try:
        question_uuid = validate_uuid(question_id)
        user_uuid = validate_uuid(user_id)

        result = await db.execute(
            select(Question, Survey).join(
                Survey, Question.survey_id == Survey.id
            ).where(
                Question.id == question_uuid,
                Survey.author_id == user_uuid
            )
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=404, detail="Question not found")

        question = row[0]
        await db.delete(question)
        await db.commit()
        return {"message": "Question deleted"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Database constraint violation")
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")
