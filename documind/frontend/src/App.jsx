import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BrainCircuit, FileText, UploadCloud, MessageSquare, Search, Sparkles,
  Files, Trash2, Send, Menu, X, BookOpen, GitCompareArrows, LoaderCircle,
  CheckCircle2, AlertCircle, ExternalLink, PanelLeftClose
} from 'lucide-react'

const API = ''

function App() {
  const [docs, setDocs] = useState([])
  const [active, setActive] = useState('chat')
  const [selected, setSelected] = useState([])
  const [question, setQuestion] = useState('')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const uploadRef = useRef(null)

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, options)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.detail || 'Something went wrong.')
    return data
  }

  async function refreshDocs() {
    try {
      const data = await api('/api/documents')
      setDocs(data.documents || [])
    } catch (e) { setError(`Cannot reach the backend: ${e.message}`) }
  }

  useEffect(() => { refreshDocs() }, [])
  const selectedDocs = useMemo(() => docs.filter(d => selected.includes(d.id)), [docs, selected])

  function toggleDoc(id) {
    setSelected(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id])
  }

  async function uploadFiles(fileList) {
    if (!fileList?.length) return
    setBusy(true); setError(''); setNotice('')
    const form = new FormData()
    Array.from(fileList).forEach(file => form.append('files', file))
    try {
      const data = await api('/api/documents/upload', { method: 'POST', body: form })
      const names = (data.uploaded || []).map(d => d.name)
      setNotice(names.length ? `Added ${names.length} document(s): ${names.join(', ')}` : 'No documents were added.')
      if (data.errors?.length) setError(data.errors.map(e => `${e.filename}: ${e.error}`).join(' · '))
      await refreshDocs()
      if (data.uploaded?.length) setSelected(old => [...new Set([...old, ...data.uploaded.map(d => d.id)])])
    } catch (e) { setError(e.message) }
    finally { setBusy(false); if (uploadRef.current) uploadRef.current.value = '' }
  }

  async function removeDoc(id) {
    if (!window.confirm('Remove this document from DocuMind?')) return
    try {
      await api(`/api/documents/${id}`, { method: 'DELETE' })
      setSelected(old => old.filter(x => x !== id))
      await refreshDocs()
      setNotice('Document removed.')
    } catch (e) { setError(e.message) }
  }

  async function ask() {
    if (!question.trim()) return
    const q = question.trim()
    setMessages(old => [...old, { role: 'user', text: q }])
    setQuestion(''); setBusy(true); setError('')
    try {
      const data = await api('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, document_ids: selected })
      })
      setMessages(old => [...old, { role: 'assistant', text: data.answer, citations: data.citations }])
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function runSearch() {
    if (!query.trim()) return
    setBusy(true); setError(''); setResult(null)
    try {
      const data = await api('/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, document_ids: selected })
      })
      setResult({ type: 'search', ...data })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  async function runAction(type) {
    setBusy(true); setError(''); setResult(null)
    try {
      const endpoint = type === 'summary' ? '/api/summarize' : '/api/compare'
      const data = await api(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: selected })
      })
      setResult({ type, ...data })
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  const navItems = [
    { id: 'chat', label: 'AI Workspace', icon: MessageSquare, hint: 'Ask across your files' },
    { id: 'search', label: 'Smart Search', icon: Search, hint: 'Find exact context' },
    { id: 'library', label: 'My Library', icon: Files, hint: 'Manage documents' },
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <div className="brand"><div className="brand-mark"><BrainCircuit size={23}/></div><div><b>documind</b><span>KNOWLEDGE, CONNECTED</span></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button></div>
        <button className="upload-cta" onClick={() => uploadRef.current?.click()}><UploadCloud size={18}/> Upload documents</button>
        <input ref={uploadRef} type="file" accept=".pdf,.docx,.txt" multiple hidden onChange={e => uploadFiles(e.target.files)}/>
        <div className="nav-label">WORKSPACE</div>
        <nav>{navItems.map(item => <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => {setActive(item.id);setResult(null);setMobileNav(false)}}><item.icon size={18}/><span>{item.label}</span>{active === item.id && <span className="nav-dot"/>}</button>)}</nav>
        <div className="library-mini">
          <div className="nav-label">YOUR DOCUMENTS <span>{docs.length}</span></div>
          {docs.length === 0 ? <p className="empty-mini">Your library is waiting for its first document.</p> : docs.slice(0, 5).map(d => <button key={d.id} className="mini-doc" onClick={() => toggleDoc(d.id)}><FileText size={15}/><span>{d.name}</span>{selected.includes(d.id) && <CheckCircle2 size={14} className="selected-check"/>}</button>)}
          {docs.length > 5 && <p className="more-docs">+{docs.length - 5} more in library</p>}
        </div>
        <div className="sidebar-bottom"><div className="status-pip"/><span>Private workspace</span><span className="version">v1.0</span></div>
      </aside>

      {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}
      <main className="main-area">
        <header className="topbar"><button className="menu-btn" onClick={() => setMobileNav(true)}><Menu/></button><div className="breadcrumb">Workspace <span>/</span> <b>{navItems.find(n => n.id === active)?.label}</b></div><div className="top-right"><span className="secure"><span/> Local document library</span><div className="avatar">D</div></div></header>
        <div className="content">
          {(notice || error) && <div className={`notice ${error ? 'is-error' : ''}`}><span>{error || notice}</span><button onClick={() => {setNotice('');setError('')}}><X size={15}/></button></div>}
          {active === 'chat' && <ChatView docs={docs} selected={selected} toggleDoc={toggleDoc} selectedDocs={selectedDocs} messages={messages} question={question} setQuestion={setQuestion} ask={ask} busy={busy} runAction={runAction} />}
          {active === 'search' && <SearchView query={query} setQuery={setQuery} runSearch={runSearch} busy={busy} result={result} />}
          {active === 'library' && <LibraryView docs={docs} selected={selected} toggleDoc={toggleDoc} removeDoc={removeDoc} upload={() => uploadRef.current?.click()} />}
          {result && active !== 'library' && <ResultPanel result={result}/>}
          {busy && <div className="working"><LoaderCircle className="spin" size={17}/> Working on your documents…</div>}
          <footer className="footer-note">DocuMind can make mistakes. Verify important details against the cited source documents.</footer>
        </div>
      </main>
    </div>
  )
}

function ChatView({ docs, selected, toggleDoc, selectedDocs, messages, question, setQuestion, ask, busy, runAction }) {
  return <div className="workspace-grid">
    <section className="primary-column">
      <div className="page-heading"><div><div className="eyebrow"><Sparkles size={14}/> YOUR AI RESEARCH DESK</div><h1>Ask your documents<br/><em>anything.</em></h1><p>One question. Multiple files. Answers grounded in your own knowledge.</p></div><div className="hero-orb"><BrainCircuit size={45}/><span/></div></div>
      <div className="chat-card">
        <div className="chat-top"><div className="live-dot"/> <b>DocuMind Assistant</b><span className="context-label">{selected.length ? `${selected.length} selected` : 'All documents'}</span></div>
        <div className="chat-body">
          {messages.length === 0 ? <div className="welcome"><div className="welcome-icon"><BookOpen size={23}/></div><h3>Start with a question</h3><p>I'll search your uploaded documents and show where each answer came from.</p><div className="suggestions">{['Summarise the key ideas','What are the main conclusions?','Find important dates and figures'].map(q => <button key={q} onClick={() => setQuestion(q)}>{q}<span>↗</span></button>)}</div></div> : messages.map((m, i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === 'user' ? 'You' : <BrainCircuit size={17}/>}</div><div className="message-content"><b>{m.role === 'user' ? 'You' : 'DocuMind'}</b><p>{m.text}</p>{m.citations?.length > 0 && <div className="citation-list"><span className="citation-title">SOURCES</span>{m.citations.map((c,j) => <div className="citation" key={j}><FileText size={13}/><span>{c.document}</span><small>{c.reference}</small></div>)}</div>}</div></div>)}
        </div>
        <div className="composer"><textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if(e.key === 'Enter' && !e.shiftKey){e.preventDefault();ask()}}} placeholder="Ask a question about your documents…" rows="2"/><button className="send-btn" onClick={ask} disabled={busy || !question.trim()}><Send size={17}/></button></div>
        <div className="composer-foot"><span>↵ Enter to send · Shift + Enter for a new line</span><span>Source-backed responses</span></div>
      </div>
      <div className="quick-tools"><button onClick={() => runAction('summary')} disabled={!selected.length}><Sparkles size={16}/><span><b>Summarise</b><small>Key points from selected files</small></span></button><button onClick={() => runAction('compare')} disabled={selected.length < 2}><GitCompareArrows size={16}/><span><b>Compare documents</b><small>Similarities and differences</small></span></button></div>
    </section>
    <aside className="context-panel"><div className="panel-title"><div><span className="eyebrow">CONTEXT</span><h3>Knowledge sources</h3></div><span className="count-badge">{docs.length}</span></div><p className="panel-desc">Choose which documents DocuMind should use for your answer. Leave all unchecked to search everything.</p>
      {docs.length === 0 ? <div className="no-docs"><UploadCloud size={24}/><b>No documents yet</b><span>Upload PDFs, Word files or text documents to begin.</span></div> : <div className="source-list">{docs.map(d => <label className="source-item" key={d.id}><input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleDoc(d.id)}/><div className="file-icon"><FileText size={16}/></div><div className="source-info"><b>{d.name}</b><small>{d.chunk_count} searchable sections</small></div></label>)}</div>}
      <div className="context-tip"><Sparkles size={15}/><p><b>Pro tip</b><br/>Select two or more files and use Compare to discover shared themes and differences.</p></div>
    </aside>
  </div>
}

function SearchView({ query, setQuery, runSearch, busy, result }) {
  return <div className="single-view"><div className="eyebrow"><Search size={14}/> DISCOVER WHAT YOU KNOW</div><h1>Search with <em>meaning.</em></h1><p className="view-subtitle">Find ideas and passages even when your words don't exactly match the document.</p><div className="search-box"><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && runSearch()} placeholder="Try: project deadlines, research methods, budget…"/><button onClick={runSearch} disabled={busy || !query.trim()}>Search</button></div><div className="search-hint">Semantic-style relevance search · Results include document and page/paragraph references</div></div>
}

function LibraryView({ docs, selected, toggleDoc, removeDoc, upload }) {
  const total = docs.reduce((n,d) => n + d.size, 0)
  const pretty = bytes => bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`
  return <div className="single-view"><div className="eyebrow"><Files size={14}/> YOUR KNOWLEDGE BASE</div><div className="library-heading"><div><h1>My <em>Library.</em></h1><p className="view-subtitle">Your documents, organised and ready to search.</p></div><button className="primary-btn" onClick={upload}><UploadCloud size={17}/> Add documents</button></div><div className="stats-row"><div><small>DOCUMENTS</small><b>{docs.length}</b></div><div><small>INDEXED SECTIONS</small><b>{docs.reduce((n,d)=>n+d.chunk_count,0)}</b></div><div><small>STORAGE USED</small><b>{pretty(total)}</b></div></div>{docs.length === 0 ? <div className="library-empty"><UploadCloud size={30}/><h3>Your library starts here</h3><p>Upload PDF, DOCX or TXT files. DocuMind will make their text searchable.</p><button className="primary-btn" onClick={upload}>Upload first document</button></div> : <div className="doc-table"><div className="table-head"><span>DOCUMENT</span><span>TYPE</span><span>SECTIONS</span><span>SIZE</span><span>ACTION</span></div>{docs.map(d => <div className="table-row" key={d.id}><label className="doc-name"><input type="checkbox" checked={selected.includes(d.id)} onChange={()=>toggleDoc(d.id)}/><div className="file-icon"><FileText size={17}/></div><b>{d.name}</b></label><span className="type-pill">{d.type.toUpperCase()}</span><span>{d.chunk_count}</span><span>{pretty(d.size)}</span><button className="delete-btn" onClick={()=>removeDoc(d.id)} title="Delete document"><Trash2 size={16}/></button></div>)}</div>}</div>
}

function ResultPanel({ result }) {
  const title = result.type === 'search' ? 'Search results' : result.type === 'summary' ? 'Document summary' : 'Document comparison'
  const body = result.type === 'search' ? null : result.summary || result.comparison
  return <section className="result-panel"><div className="result-head"><div><span className="eyebrow">DOCUMIND ANALYSIS</span><h2>{title}</h2></div><Sparkles size={20}/></div>{body && <p className="result-body">{body}</p>}{result.results?.length ? <div className="result-items">{result.results.map((r,i)=><article className="result-item" key={r.id}><div className="result-item-head"><b>{r.document_name}</b><span>{r.reference}</span></div><p>{r.text}</p><small>Relevance score: {r.score}</small></article>)}</div> : null}{result.citations?.length > 0 && <div className="result-citations"><b>Sources used</b>{result.citations.map((c,i)=><div key={i}><FileText size={14}/>{c.document}<span>{c.reference}</span></div>)}</div>}</section>
}

export default App
