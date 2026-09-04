import { FaLanguage, FaPalette, FaSlidersH } from "react-icons/fa";
import { useAppearance } from "../../context/AppearanceContext";
import "./Settings.css";

const languages = ["English", "Hindi", "Hinglish"];

function Settings() {
  const { activeTheme, preferences, themes, updatePreferences } = useAppearance();

  return (
    <main className="user-settings-page">
      <header className="user-settings-header"><p><FaSlidersH aria-hidden="true" /> Account</p><h1>Settings</h1><span>Personalize BharatTube for this device and account.</span></header>

      <section className="user-settings-section" aria-labelledby="appearance-settings-title">
        <div className="user-settings-title"><FaPalette aria-hidden="true" /><div><h2 id="appearance-settings-title">Appearance</h2><p>Choose a color theme for your BharatTube background.</p></div></div>
        <div className="theme-grid" role="radiogroup" aria-label="Choose appearance theme">
          {themes.map((theme) => <button key={theme.id} type="button" className={`theme-option ${activeTheme.id === theme.id ? "active" : ""}`} onClick={() => updatePreferences({ themeId: theme.id })} role="radio" aria-checked={activeTheme.id === theme.id}>
            <span style={{ background: `linear-gradient(135deg, ${theme.background}, ${theme.surface})` }}><i style={{ background: theme.accent }} /></span><strong>{theme.label}</strong>
          </button>)}
        </div>
      </section>

      <section className="user-settings-section" aria-labelledby="language-settings-title">
        <div className="user-settings-title"><FaLanguage aria-hidden="true" /><div><h2 id="language-settings-title">Language</h2><p>Save your preferred BharatTube language for future localized screens.</p></div></div>
        <label className="language-select">Preferred language<select value={preferences.language} onChange={(event) => updatePreferences({ language: event.target.value })}>{languages.map((language) => <option key={language} value={language}>{language}</option>)}</select></label>
      </section>
    </main>
  );
}

export default Settings;
