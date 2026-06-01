function copyWithExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

/** Копирует текст в буфер (HTTP — execCommand, HTTPS — Clipboard API). */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  // Clipboard API только в secure context (HTTPS / localhost)
  if (window.isSecureContext) {
    const clipboard = navigator.clipboard
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(text)
        return true
      } catch {
        // permission denied и т.п.
      }
    }
  }

  return copyWithExecCommand(text)
}
