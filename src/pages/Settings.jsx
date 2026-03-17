import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function Settings() {
  const user = useStore((state) => state.user)
  const setUser = useStore((state) => state.setUser)
  const setUserRole = useStore((state) => state.setUserRole)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const toggleNotificationSetting = useStore((state) => state.toggleNotificationSetting)
  const addToast = useStore((state) => state.addToast)

  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    department: user.department || ''
  })

  const handleProfileSave = () => {
    setUser(profileForm)
    addToast('Profile updated successfully', 'success')
  }

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'security', label: 'Security' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </header>

      {/* Settings Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--space-6)' }}>
        {/* Sidebar Tabs */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                textAlign: 'left',
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-medium)',
                fontWeight: activeTab === tab.id ? 'var(--font-medium)' : 'var(--font-normal)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Profile Information</h2>
                <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Update your account details</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <figure data-variant="avatar" style={{ 
                  width: 80, height: 80, 
                  background: 'var(--erp-primary)', color: 'white', 
                  fontSize: 'var(--text-3)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  borderRadius: '50%', fontWeight: 'var(--font-medium)' 
                }}>
                  {user.initials}
                </figure>
                <div>
                  <button data-variant="secondary" className="small">Change Avatar</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Department</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) => setProfileForm(f => ({ ...f, department: e.target.value }))}
                  />
                </div>
                <div>
                  <label>Role</label>
                  <select
                    value={user.role}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    <option value="admin">Administrator</option>
                    <option value="manager">Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div>
                <button onClick={handleProfileSave}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Notification Preferences</h2>
                <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Choose how you want to be notified</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleNotificationSetting(key)}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Appearance</h2>
                <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Customize the look and feel</p>
              </div>

              <div>
                <label style={{ marginBottom: 'var(--space-2)', display: 'block' }}>Theme</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    onClick={() => setTheme('light')}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      border: `2px solid ${theme === 'light' ? 'var(--erp-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-medium)',
                      background: theme === 'light' ? 'color-mix(in srgb, var(--erp-primary) 10%, transparent)' : 'var(--background)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      border: `2px solid ${theme === 'dark' ? 'var(--erp-primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-medium)',
                      background: theme === 'dark' ? 'color-mix(in srgb, var(--erp-primary) 10%, transparent)' : 'var(--background)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)'
                    }}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--text-5)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>Security</h2>
                <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)' }}>Manage your security settings</p>
              </div>

              <div>
                <h3 style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-3)' }}>Change Password</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: '400px' }}>
                  <div>
                    <label>Current Password</label>
                    <input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label>New Password</label>
                    <input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password" />
                  </div>
                  <button style={{ alignSelf: 'flex-start' }}>Update Password</button>
                </div>
              </div>

              <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-3)' }}>Two-Factor Authentication</h3>
                <p style={{ fontSize: 'var(--text-7)', color: 'var(--muted-foreground)', marginBottom: 'var(--space-3)' }}>
                  Add an extra layer of security to your account
                </p>
                <button data-variant="secondary">Enable 2FA</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
