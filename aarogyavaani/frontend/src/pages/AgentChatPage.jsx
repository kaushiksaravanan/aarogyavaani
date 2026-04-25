import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Wrench, Brain, ChevronDown, ChevronRight, Sparkles, Clock, AlertTriangle, Pill, FileText, ListTodo, Shield, Zap, RotateCcw, User } from 'lucide-react'
import { AppPage, PageHeader, SurfaceCard, PrimaryButton, SecondaryButton, Badge, appTheme } from '../components/AppPrimitives'
import { getStoredUserId } from '../lib/profileStore'
import { agentChat, getAgentCapabilities, runProactiveCheck, runWorkflow } from '../lib/api'

const AGENT_ICONS = {
  router: Brain,
  triage: AlertTriangle,
  knowledge: Brain,
  medication: Pill,
  report: FileText,
  followup: ListTodo,
  proactive: Shield,
}

const AGENT_COLORS = {
  router: '#8b5cf6',
  triage: '#ef4444',
  knowledge: '#3b82f6',
  medication: '#10b981',
  report: '#f59e0b',
  followup: '#6366f1',
  proactive: '#ec4899',
}

const SUGGESTED_QUERIES = [
  { text: 'What are my current medications?', icon: Pill, agent: 'medication' },
  { text: 'Check my latest health reports', icon: FileText, agent: 'report' },
  { text: 'I have a headache and mild fever', icon: AlertTriangle, agent: 'triage' },
  { text: 'What follow-up tasks do I have?', icon: ListTodo, agent: 'followup' },
  { text: 'Tell me about diabetes management', icon: Brain, agent: 'knowledge' },
  { text: 'Run a proactive health check', icon: Shield, agent: 'proactive' },
]

function ToolCallTrace({ toolCall }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      style={{
        background: 'rgba(139, 92, 246, 0.06)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        borderRadius: '0.75rem',
        padding: '0.6rem 0.8rem',
        fontSize: '0.78rem',
        marginBottom: '0.4rem',
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Wrench style={{ width: 12, height: 12, color: '#8b5cf6' }} />
        <span style={{ fontWeight: 600, color: '#5b21b6' }}>{toolCall.tool_name}</span>
        {toolCall.duration_ms > 0 && (
          <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{toolCall.duration_ms}ms</span>
        )}
        {toolCall.error && <Badge tone="danger" style={{ fontSize: '0.65rem' }}>Error</Badge>}
        <span style={{ marginLeft: 'auto' }}>
          {expanded ? <ChevronDown style={{ width: 12, height: 12 }} /> : <ChevronRight style={{ width: 12, height: 12 }} />}
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
          {Object.keys(toolCall.arguments || {}).length > 0 && (
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>Args: </span>
              <code style={{ color: '#374151', fontSize: '0.72rem', wordBreak: 'break-all' }}>
                {JSON.stringify(toolCall.arguments)}
              </code>
            </div>
          )}
          {toolCall.result_summary && (
            <div>
              <span style={{ color: '#6b7280', fontWeight: 600 }}>Result: </span>
              <span style={{ color: '#374151', fontSize: '0.72rem' }}>{toolCall.result_summary.slice(0, 200)}</span>
            </div>
          )}
          {toolCall.error && (
            <div style={{ color: '#b91c1c', marginTop: '0.3rem' }}>Error: {toolCall.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

function AgentSteps({ steps }) {
  const [expanded, setExpanded] = useState(false)
  if (!steps || steps.length === 0) return null

  const toolSteps = steps.filter(s => s.action === 'tool_call')
  const totalTools = toolSteps.reduce((acc, s) => acc + (s.tool_calls?.length || 0), 0)

  return (
    <div style={{ marginTop: '0.6rem' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: '#8b5cf6',
          fontWeight: 600,
          padding: '0.3rem 0',
        }}
      >
        <Zap style={{ width: 12, height: 12 }} />
        {steps.length} step{steps.length !== 1 ? 's' : ''} &middot; {totalTools} tool call{totalTools !== 1 ? 's' : ''}
        {expanded ? <ChevronDown style={{ width: 12, height: 12 }} /> : <ChevronRight style={{ width: 12, height: 12 }} />}
      </button>
      {expanded && (
        <div style={{ marginTop: '0.5rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              {step.action === 'thinking' && (
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Brain style={{ width: 11, height: 11 }} />
                  {step.content || 'Thinking...'}
                </div>
              )}
              {step.action === 'tool_call' && step.tool_calls?.map((tc, j) => (
                <ToolCallTrace key={j} toolCall={tc} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const AgentIcon = AGENT_ICONS[message.agentRole] || Bot

  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div
        style={{
          width: '2.2rem',
          height: '2.2rem',
          borderRadius: '0.9rem',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          background: isUser ? 'rgba(198,117,12,0.12)' : `${AGENT_COLORS[message.agentRole] || '#8b5cf6'}15`,
          border: `1px solid ${isUser ? appTheme.border : (AGENT_COLORS[message.agentRole] || '#8b5cf6') + '25'}`,
        }}
      >
        {isUser ? (
          <User style={{ width: 14, height: 14, color: appTheme.copper }} />
        ) : (
          <AgentIcon style={{ width: 14, height: 14, color: AGENT_COLORS[message.agentRole] || '#8b5cf6' }} />
        )}
      </div>

      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        {!isUser && message.agentsUsed?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            {message.agentsUsed.map((a, i) => (
              <Badge key={i} style={{ fontSize: '0.65rem', background: `${AGENT_COLORS[a] || '#8b5cf6'}12`, color: AGENT_COLORS[a] || '#8b5cf6', border: `1px solid ${AGENT_COLORS[a] || '#8b5cf6'}25` }}>
                {a} agent
              </Badge>
            ))}
          </div>
        )}

        <div
          style={{
            background: isUser
              ? `linear-gradient(135deg, ${appTheme.copperStrong}, ${appTheme.copper})`
              : appTheme.cardBg,
            color: isUser ? '#fff' : appTheme.espresso,
            padding: '0.85rem 1rem',
            borderRadius: isUser ? '1.2rem 1.2rem 0.3rem 1.2rem' : '1.2rem 1.2rem 1.2rem 0.3rem',
            border: isUser ? 'none' : `1px solid ${appTheme.border}`,
            boxShadow: isUser ? '0 4px 16px rgba(76,46,18,0.16)' : appTheme.shadow,
            fontSize: '0.9rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>

        {!isUser && message.toolsUsed?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            {message.toolsUsed.map((t, i) => (
              <span key={i} style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Wrench style={{ width: 9, height: 9 }} />{t}
              </span>
            ))}
          </div>
        )}

        {!isUser && message.steps && <AgentSteps steps={message.steps} />}
      </div>
    </div>
  )
}

function WorkflowButton({ workflow, onClick, loading }) {
  return (
    <button
      onClick={() => onClick(workflow.type)}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        padding: '0.8rem',
        background: '#fff',
        border: `1px solid ${appTheme.border}`,
        borderRadius: '1rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        width: '100%',
        opacity: loading ? 0.6 : 1,
        transition: 'all 160ms ease',
      }}
    >
      <Zap style={{ width: 16, height: 16, color: '#8b5cf6', marginTop: '0.1rem', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: appTheme.espresso }}>{workflow.name}</div>
        <div style={{ fontSize: '0.75rem', color: appTheme.espressoSoft, lineHeight: 1.5, marginTop: '0.15rem' }}>{workflow.description}</div>
      </div>
    </button>
  )
}

export default function AgentChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [capabilities, setCapabilities] = useState(null)
  const [showWorkflows, setShowWorkflows] = useState(false)
  const [proactiveAlerts, setProactiveAlerts] = useState(null)
  const [proactiveLoading, setProactiveLoading] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const userId = getStoredUserId()

  useEffect(() => {
    getAgentCapabilities().then(setCapabilities)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const result = await agentChat({
        userId: userId || 'demo-user',
        message: text.trim(),
        conversationId,
        agentRole: 'auto',
      })

      if (result.conversation_id) setConversationId(result.conversation_id)

      const agentMsg = {
        role: 'assistant',
        content: result.response || 'No response generated.',
        agentsUsed: result.agents_used || [],
        toolsUsed: result.tools_used || [],
        steps: result.steps || [],
        agentRole: result.agents_used?.[0] || 'router',
        totalSteps: result.total_steps || 0,
      }
      setMessages(prev => [...prev, agentMsg])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', agentRole: 'router' },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [userId, conversationId, loading])

  const handleWorkflow = async (workflowType) => {
    setLoading(true)
    setMessages(prev => [
      ...prev,
      { role: 'user', content: `Run workflow: ${workflowType}` },
    ])

    try {
      const result = await runWorkflow({
        userId: userId || 'demo-user',
        workflowType,
      })

      const agentMsg = {
        role: 'assistant',
        content: result.result || 'Workflow completed.',
        agentsUsed: result.agents_used || [],
        toolsUsed: result.tools_used || [],
        steps: result.steps || [],
        agentRole: 'router',
        totalSteps: result.total_steps || 0,
      }
      setMessages(prev => [...prev, agentMsg])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Workflow failed. Please try again.', agentRole: 'router' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleProactiveCheck = async () => {
    setProactiveLoading(true)
    try {
      const result = await runProactiveCheck(userId || 'demo-user')
      setProactiveAlerts(result)
    } catch (err) {
      setProactiveAlerts({ alerts: [{ message: 'Could not run proactive check.', priority: 'low', category: 'important' }] })
    } finally {
      setProactiveLoading(false)
    }
  }

  const newConversation = () => {
    setMessages([])
    setConversationId('')
    setProactiveAlerts(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <AppPage maxWidth="56rem">
      <PageHeader
        icon={Bot}
        eyebrow="Agentic AI &middot; Powered by Google Gemini"
        title="Health Agent"
        subtitle="AI-powered health assistant with autonomous tool use, multi-agent orchestration, and proactive analysis — built on Gemini 2.0 Flash."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <SecondaryButton onClick={() => setShowWorkflows(!showWorkflows)}>
              <Zap className="w-4 h-4" />Workflows
            </SecondaryButton>
            <SecondaryButton onClick={handleProactiveCheck} disabled={proactiveLoading}>
              <Shield className="w-4 h-4" />{proactiveLoading ? 'Checking...' : 'Proactive Check'}
            </SecondaryButton>
            {messages.length > 0 && (
              <SecondaryButton onClick={newConversation}>
                <RotateCcw className="w-4 h-4" />New
              </SecondaryButton>
            )}
          </div>
        }
      />

      {/* Proactive Alerts */}
      {proactiveAlerts?.alerts?.length > 0 && (
        <SurfaceCard title="Proactive Health Alerts" icon={Shield} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {proactiveAlerts.alerts.map((alert, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '0.8rem',
                  background: alert.priority === 'high' ? '#fef2f2' : alert.priority === 'medium' ? '#fffbeb' : '#f0fdf4',
                  border: `1px solid ${alert.priority === 'high' ? '#fecaca' : alert.priority === 'medium' ? '#fde68a' : '#bbf7d0'}`,
                }}
              >
                <AlertTriangle
                  style={{
                    width: 14,
                    height: 14,
                    marginTop: '0.15rem',
                    flexShrink: 0,
                    color: alert.priority === 'high' ? '#b91c1c' : alert.priority === 'medium' ? '#92400e' : '#166534',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', color: appTheme.espresso, lineHeight: 1.55 }}>{alert.message}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                    <Badge tone={alert.priority === 'high' ? 'danger' : alert.priority === 'medium' ? 'warning' : 'success'} style={{ fontSize: '0.62rem' }}>
                      {alert.priority}
                    </Badge>
                    <Badge style={{ fontSize: '0.62rem' }}>{alert.category}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {proactiveAlerts.tools_used?.length > 0 && (
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Tools used:</span>
              {proactiveAlerts.tools_used.map((t, i) => (
                <span key={i} style={{ fontSize: '0.68rem', color: '#8b5cf6' }}>{t}</span>
              ))}
            </div>
          )}
        </SurfaceCard>
      )}

      {/* Workflow Panel */}
      {showWorkflows && capabilities?.workflows && (
        <SurfaceCard title="Autonomous Workflows" icon={Zap} style={{ marginBottom: '1rem' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            {capabilities.workflows.map((wf) => (
              <WorkflowButton key={wf.type} workflow={wf} onClick={handleWorkflow} loading={loading} />
            ))}
          </div>
        </SurfaceCard>
      )}

      {/* Agent Capabilities (shown when chat is empty) */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <SurfaceCard title="Specialist Agents" icon={Sparkles}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" style={{ marginBottom: '1.25rem' }}>
              {(capabilities?.agents || []).slice(0, 6).map((agent) => {
                const Icon = AGENT_ICONS[agent.role] || Bot
                const color = AGENT_COLORS[agent.role] || '#8b5cf6'
                return (
                  <div
                    key={agent.role}
                    style={{
                      padding: '0.8rem',
                      borderRadius: '1rem',
                      border: `1px solid ${appTheme.border}`,
                      background: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                      <Icon style={{ width: 14, height: 14, color }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: appTheme.espresso }}>{agent.name}</span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: appTheme.espressoSoft, lineHeight: 1.55 }}>
                      {agent.description.slice(0, 100)}
                    </p>
                  </div>
                )
              })}
            </div>

            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: appTheme.espressoSoft, marginBottom: '0.6rem' }}>
                Try asking:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SUGGESTED_QUERIES.map((sq, i) => {
                  const Icon = sq.icon
                  const color = AGENT_COLORS[sq.agent] || '#8b5cf6'
                  return (
                    <button
                      key={i}
                      onClick={() => sendMessage(sq.text)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '999px',
                        border: `1px solid ${appTheme.border}`,
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        color: appTheme.espresso,
                        transition: 'all 140ms ease',
                      }}
                    >
                      <Icon style={{ width: 12, height: 12, color }} />
                      {sq.text}
                    </button>
                  )
                })}
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div
          style={{
            background: appTheme.cardBg,
            border: `1px solid ${appTheme.border}`,
            borderRadius: '1.4rem',
            boxShadow: appTheme.shadow,
            padding: '1.25rem',
            marginBottom: '1rem',
            minHeight: '20rem',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '2.2rem',
                  height: '2.2rem',
                  borderRadius: '0.9rem',
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                }}
              >
                <Bot style={{ width: 14, height: 14, color: '#8b5cf6' }} />
              </div>
              <div
                style={{
                  background: appTheme.cardBg,
                  border: `1px solid ${appTheme.border}`,
                  borderRadius: '1.2rem 1.2rem 1.2rem 0.3rem',
                  padding: '0.85rem 1rem',
                  boxShadow: appTheme.shadow,
                }}
              >
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <div className="agent-thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'agentPulse 1.2s infinite 0s' }} />
                  <div className="agent-thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'agentPulse 1.2s infinite 0.2s' }} />
                  <div className="agent-thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'agentPulse 1.2s infinite 0.4s' }} />
                  <span style={{ fontSize: '0.78rem', color: '#8b5cf6', marginLeft: '0.4rem', fontWeight: 500 }}>Agent thinking & using tools...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          position: 'sticky',
          bottom: '1rem',
          background: appTheme.cardBg,
          border: `1px solid ${appTheme.border}`,
          borderRadius: '1.4rem',
          boxShadow: '0 -4px 24px rgba(76,46,18,0.08), 0 8px 32px rgba(76,46,18,0.12)',
          padding: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your health, medications, reports, or symptoms..."
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.92rem',
            fontFamily: appTheme.bodyFont,
            color: appTheme.espresso,
            padding: '0.5rem 0.3rem',
            lineHeight: 1.5,
            maxHeight: '6rem',
            overflowY: 'auto',
          }}
        />
        <PrimaryButton
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{ borderRadius: '1rem', padding: '0.65rem 1rem', flexShrink: 0 }}
        >
          <Send className="w-4 h-4" />
        </PrimaryButton>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingTop: '0.4rem', paddingLeft: '0.3rem' }}>
          <Sparkles style={{ width: 10, height: 10, color: '#4285f4' }} />
          <span style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Powered by Google Gemini 2.0 Flash</span>
        </div>
      </div>

      {/* CSS for thinking animation */}
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AppPage>
  )
}
