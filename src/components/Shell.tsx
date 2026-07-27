import { BookOpen, Check, ClipboardCheck, FileDown, FileSearch, FlaskConical, RotateCcw, ShieldCheck } from 'lucide-react'
import { APPLICATION_VERSION_LABEL } from '../lib/appVersion'
import type { AnalysisMode, AppView, ProjectBrief } from '../types'

interface ShellProps {
  view: AppView
  project: ProjectBrief | null
  children: React.ReactNode
  canReview: boolean
  canAudit: boolean
  lockStageNavigation?: boolean
  onNavigate: (view: AppView) => void
  onReset: () => void
  onSaveProject: () => void
  onManageData: () => void
}

const stages: { key: AppView; label: string; eyebrow: string; icon: typeof BookOpen }[] = [
  { key: 'setup', label: 'Project brief', eyebrow: '01', icon: BookOpen },
  { key: 'materials', label: 'Review materials', eyebrow: '02', icon: ClipboardCheck },
  { key: 'queue', label: 'Independent review', eyebrow: '03', icon: FileSearch },
  { key: 'audit', label: 'Audit trail', eyebrow: '04', icon: Check },
]

const viewOrder: AppView[] = ['landing', 'setup', 'materials', 'freeze', 'reviewing', 'queue', 'case', 'audit']

export function AppHeader({
  onReset,
  inProject,
  onSaveProject,
  onManageData,
}: {
  onReset: () => void
  inProject: boolean
  onSaveProject?: () => void
  onManageData: () => void
}) {
  return (
    <header className="app-header">
      <button className="brand" type="button" onClick={inProject ? onReset : undefined} aria-label="QualiAudit home">
        <span className="brand-mark" aria-hidden="true">
          <span>Q</span>
        </span>
        <span className="brand-name">QualiAudit</span>
        <span className="version-chip">{APPLICATION_VERSION_LABEL}</span>
      </button>
      <div className="header-actions">
        <span className="local-chip"><span className="status-dot" /> Local browser session</span>
        <button className="icon-button" type="button" onClick={onManageData} title="Review local data and privacy">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Data &amp; privacy</span>
        </button>
        {inProject && (
          <>
            <button className="icon-button" type="button" onClick={onSaveProject} title="Save a resumable local project file">
              <FileDown size={16} aria-hidden="true" />
              <span>Save project</span>
            </button>
            <button className="icon-button" type="button" onClick={onReset} title="Start over">
              <RotateCcw size={16} aria-hidden="true" />
              <span>Start over</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}

export function Shell({
  view,
  project,
  children,
  canReview,
  canAudit,
  lockStageNavigation = false,
  onNavigate,
  onReset,
  onSaveProject,
  onManageData,
}: ShellProps) {
  const activeKey = view === 'freeze' ? 'materials' : view === 'reviewing' || view === 'case' ? 'queue' : view
  const currentIndex = viewOrder.indexOf(view)
  const enabled = (key: AppView) => {
    if (lockStageNavigation && key !== 'setup') return false
    if (key === 'setup' || key === 'materials') return Boolean(project)
    if (key === 'queue') return canReview
    if (key === 'audit') return canAudit
    return false
  }

  return (
    <div className="app-frame">
      <AppHeader onReset={onReset} inProject onSaveProject={onSaveProject} onManageData={onManageData} />
      <div className="workspace-layout">
        <aside className="project-sidebar" aria-label="Review progress">
          <div className="project-context">
            <span className="overline">CURRENT REVIEW</span>
            <p>{project?.name}</p>
          </div>
          <nav className="stage-nav">
            {stages.map(({ key, label, eyebrow, icon: Icon }) => {
              const active = activeKey === key
              const done = viewOrder.indexOf(key) < currentIndex && enabled(key)
              return (
                <button
                  key={key}
                  type="button"
                  className={`stage-link ${active ? 'active' : ''}`}
                  onClick={() => enabled(key) && onNavigate(key)}
                  disabled={!enabled(key)}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="stage-number">{done ? <Check size={14} /> : eyebrow}</span>
                  <Icon size={17} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>
          <div className="method-card">
            <FlaskConical size={17} aria-hidden="true" />
            <div>
              <span>Analysis approach</span>
              <strong>{project?.analysisMode === 'reflexive' ? 'Reflexive thematic' : 'Codebook / framework'}</strong>
            </div>
          </div>
          <p className="sidebar-note">AI offers a reading. The researcher decides what it means.</p>
        </aside>
        <main id="main-content" className="workspace-main">{children}</main>
      </div>
    </div>
  )
}

export function ModeBadge({ mode }: { mode: AnalysisMode }) {
  return <span className="mode-badge">{mode === 'reflexive' ? 'Reflexive mode' : 'Codebook mode'}</span>
}
