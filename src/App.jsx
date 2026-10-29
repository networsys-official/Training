import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownUp,
  BookOpen,
  Check,
  ChevronDown,
  CircleAlert,
  GraduationCap,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const emptyForm = { name: '', email: '', course: '', year: '1', status: 'Active' }

async function request(path, options) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const result = response.status === 204 ? null : await response.json()
  if (!response.ok) throw new Error(result?.error || 'Something went wrong.')
  return result
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function App() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All students')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    request('/api/students')
      .then((records) => {
        if (active) setStudents(records)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const activeCount = students.filter((student) => student.status === 'Active').length
  const courseCount = new Set(students.map((student) => student.course)).size
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesStatus = statusFilter === 'All students' || student.status === statusFilter
      const matchesSearch = !query || [student.name, student.email, student.course]
        .some((value) => value.toLowerCase().includes(query))
      return matchesStatus && matchesSearch
    })
  }, [search, statusFilter, students])

  function openCreate() {
    setError('')
    setEditingStudent(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(student) {
    setError('')
    setEditingStudent(student)
    setForm({ ...student, year: String(student.year) })
    setModalOpen(true)
  }

  async function saveStudent(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = { ...form, year: Number(form.year) }
      const savedStudent = await request(
        editingStudent ? `/api/students/${editingStudent.id}` : '/api/students',
        { method: editingStudent ? 'PUT' : 'POST', body: JSON.stringify(body) },
      )
      setStudents((current) => editingStudent
        ? current.map((student) => student.id === savedStudent.id ? savedStudent : student)
        : [savedStudent, ...current])
      setModalOpen(false)
      setNotice(editingStudent ? 'Student details updated.' : 'Student added to the roster.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeStudent(student) {
    if (!window.confirm(`Remove ${student.name} from the roster?`)) return
    setError('')
    try {
      await request(`/api/students/${student.id}`, { method: 'DELETE' })
      setStudents((current) => current.filter((record) => record.id !== student.id))
      setNotice(`${student.name} was removed from the roster.`)
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  return (
    <main className="app-shell">
      <aside className="rail" aria-label="Primary navigation">
        <a className="brand-mark" href="#roster" aria-label="Roster home"><GraduationCap size={23} strokeWidth={2.2} /></a>
        <span className="rail-rule" />
        <button className="rail-link rail-link-active" type="button" title="Students" aria-label="Students"><Users size={20} /></button>
        <div className="rail-bottom"><span className="user-avatar">AD</span></div>
      </aside>

      <section className="workspace" id="roster">
        <header className="topbar">
          <div className="breadcrumb"><span>Academics</span><span className="breadcrumb-slash">/</span><strong>Students</strong></div>
          <div className="term-label"><span className="term-dot" /> Fall semester <span className="term-year">2026</span></div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div><p className="eyebrow">DIRECTORY <span>·</span> 2026 / 27</p><h1> Networsys Student roster</h1><p className="subheading">A clear view of your people, all in one place.</p></div>
            <button className="primary-button" onClick={openCreate} type="button"><Plus size={17} strokeWidth={2.4} /><span>Add student</span></button>
          </div>

          <section className="overview" aria-label="Roster overview">
            <div className="overview-item"><span className="overview-icon icon-green"><Users size={18} /></span><div><p>Total students</p><strong>{students.length}</strong></div></div>
            <span className="overview-divider" />
            <div className="overview-item"><span className="overview-icon icon-blue"><Check size={18} /></span><div><p>Currently active</p><strong>{activeCount}</strong></div></div>
            <span className="overview-divider" />
            <div className="overview-item"><span className="overview-icon icon-orange"><BookOpen size={18} /></span><div><p>Programs</p><strong>{courseCount}</strong></div></div>
            <div className="overview-note"><span className="note-mark"><ArrowDownUp size={15} /></span><span>Roster stays current<br />as records change</span></div>
          </section>

          <section className="directory" aria-label="Student directory">
            <div className="directory-heading"><div><h2>All students</h2><p>Browse and manage student records</p></div><span className="record-count">{visibleStudents.length} records</span></div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or course" aria-label="Search students" />{search && <button className="clear-search" type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label>
              <label className="filter-box"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All students</option><option>Active</option><option>On leave</option></select><ChevronDown size={15} /></label>
            </div>

            {error && !modalOpen && <div className="alert" role="alert"><CircleAlert size={17} />{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
            {notice && <div className="notice" role="status">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={15} /></button></div>}

            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Course</th><th>Year</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading && <tr><td className="table-message" colSpan="5"><LoaderCircle className="spinner" size={19} />Loading student records</td></tr>}
                  {!loading && visibleStudents.map((student, index) => (
                    <tr key={student.id} style={{ '--row-index': index }}>
                      <td><div className="student-cell"><span className={`student-avatar avatar-${index % 5}`}>{initials(student.name)}</span><span className="student-details"><strong>{student.name}</strong><span>{student.email}</span></span></div></td>
                      <td><span className="course-name">{student.course}</span></td><td><span className="year-label">Year {student.year}</span></td>
                      <td><span className={`status-pill ${student.status === 'Active' ? 'status-active' : 'status-leave'}`}><span />{student.status}</span></td>
                      <td><div className="row-actions"><button type="button" title={`Edit ${student.name}`} aria-label={`Edit ${student.name}`} onClick={() => openEdit(student)}><Pencil size={16} /></button><button type="button" title={`Remove ${student.name}`} aria-label={`Remove ${student.name}`} onClick={() => removeStudent(student)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {!loading && visibleStudents.length === 0 && <tr><td className="empty-state" colSpan="5"><span className="empty-icon"><Users size={22} /></span><strong>{search || statusFilter !== 'All students' ? 'No matching students' : 'Your roster is empty'}</strong><span>{search || statusFilter !== 'All students' ? 'Try another search or status filter.' : 'Add a student to start building your directory.'}</span>{!search && statusFilter === 'All students' && <button type="button" onClick={openCreate}><Plus size={15} />Add first student</button>}</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Showing <strong>{visibleStudents.length}</strong> of <strong>{students.length}</strong> students</span><span className="footer-sync"><span /> Changes save automatically</span></footer>
          </section>
          <p className="page-footnote">Student information is stored in your school directory.</p>
        </div>
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false) }}>
        <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-heading"><div><span className="modal-kicker">STUDENT RECORD</span><h2 id="modal-title">{editingStudent ? 'Edit student' : 'Add a student'}</h2><p>{editingStudent ? 'Update the details below.' : 'Add someone new to your directory.'}</p></div><button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close dialog"><X size={19} /></button></div>
          <form onSubmit={saveStudent}>
            <label className="field-label">Full name<input autoFocus required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Alex Morgan" /></label>
            <label className="field-label">Email address<input required type="email" maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="alex@school.edu" /></label>
            <div className="field-row"><label className="field-label">Course<input required maxLength="100" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} placeholder="e.g. Biology" /></label><label className="field-label">Year<select value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>{[1, 2, 3, 4, 5, 6, 7, 8].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></label></div>
            <label className="field-label">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Active</option><option>On leave</option></select></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spinner" size={16} /> : <Check size={16} />}{editingStudent ? 'Save changes' : 'Add student'}</button></div>
          </form>
        </section>
      </div>}
    </main>
  )
}

export default App
