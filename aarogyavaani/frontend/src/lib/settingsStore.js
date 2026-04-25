const SETTINGS_KEY = 'aarogyavaani_settings'

const defaultSettings = {
  documentPrivacyMode: 'cloud',
  ocrLanguages: ['eng'],
}

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return { ...defaultSettings, ...stored }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(nextSettings) {
  const merged = { ...defaultSettings, ...nextSettings }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
  return merged
}

export function getDocumentPrivacyMode() {
  return getSettings().documentPrivacyMode || 'cloud'
}

export function setDocumentPrivacyMode(mode) {
  return saveSettings({ ...getSettings(), documentPrivacyMode: mode })
}

export function getOcrLanguages() {
  const languages = getSettings().ocrLanguages
  return Array.isArray(languages) && languages.length > 0 ? languages : ['eng']
}

export function setOcrLanguages(languages) {
  const next = Array.isArray(languages) && languages.length > 0 ? languages : ['eng']
  return saveSettings({ ...getSettings(), ocrLanguages: next })
}
