-- =====================================================
-- 1. Таблица пользователей
-- =====================================================
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       username VARCHAR(50) UNIQUE NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       hashed_password VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. Таблица опросов
-- =====================================================
CREATE TABLE surveys (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         public_id VARCHAR(50) UNIQUE,
                         author_id UUID NOT NULL,
                         title VARCHAR(255) NOT NULL,
                         description TEXT,
                         status VARCHAR(20) DEFAULT 'draft',
                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                         updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                         published_at TIMESTAMP WITH TIME ZONE,
                         CONSTRAINT fk_author FOREIGN KEY (author_id)
                             REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. Таблица вопросов
-- =====================================================
CREATE TABLE questions (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           survey_id UUID NOT NULL,
                           text TEXT NOT NULL,
                           type VARCHAR(20) NOT NULL,
                           order_index INTEGER DEFAULT 0,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                           CONSTRAINT fk_survey FOREIGN KEY (survey_id)
                               REFERENCES surveys(id) ON DELETE CASCADE
);

-- =====================================================
-- 4. Таблица вариантов ответов (для single_choice)
-- =====================================================
CREATE TABLE options (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         question_id UUID NOT NULL,
                         text VARCHAR(500) NOT NULL,
                         order_index INTEGER DEFAULT 0,
                         CONSTRAINT fk_question FOREIGN KEY (question_id)
                             REFERENCES questions(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. Таблица ответов
-- =====================================================
CREATE TABLE answers (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         survey_id UUID NOT NULL,
                         question_id UUID NOT NULL,
                         respondent_session_id UUID NOT NULL,
                         selected_option_id UUID,
                         text_answer TEXT,
                         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                         CONSTRAINT fk_s FOREIGN KEY (survey_id)
                             REFERENCES surveys(id) ON DELETE CASCADE,
                         CONSTRAINT fk_q FOREIGN KEY (question_id)
                             REFERENCES questions(id) ON DELETE CASCADE,
                         CONSTRAINT fk_option FOREIGN KEY (selected_option_id)
                             REFERENCES options(id) ON DELETE CASCADE
);

-- =====================================================
-- Индексы для ускорения запросов
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_surveys_author_id ON surveys(author_id);
CREATE INDEX idx_surveys_public_id ON surveys(public_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_answers_survey_id ON answers(survey_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_respondent_session_id ON answers(respondent_session_id);