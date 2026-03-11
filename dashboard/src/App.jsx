import { useQuery } from '@tanstack/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const queryClient = new QueryClient()

const COLORS = {
  work: '#00e5ff', social: '#ff6b35', news: '#fbbf24',
  entertainment: '#c77dff', other: '#64748b'
}

function Dashboard() {
  const { data: today } = useQuery({
    queryKey: ['today'],
    queryFn: () => fetch('http://localhost:3000/api/summary/today').then(r => r.json()),
    refetchInterval: 10000
  })

  const { data: hoardingData } = useQuery({
    queryKey: ['hoarding'],
    queryFn: () => fetch('http://localhost:3000/api/hoarding-score').then(r => r.json()),
    refetchInterval: 15000
  })

  const { data: domainData } = useQuery({
    queryKey: ['domains'],
    queryFn: () => fetch('http://localhost:3000/api/domains').then(r => r.json()),
    refetchInterval: 15000
  })

  const { data: zombieData } = useQuery({
    queryKey: ['zombies'],
    queryFn: () => fetch('http://localhost:3000/api/zombies').then(r => r.json()),
    refetchInterval: 30000
  })

  const LEVEL_COLORS = {
    healthy: '#7cfc6e', mild: '#fbbf24', moderate: '#ff6b35', severe: '#ef4444'
  }

  const score = hoardingData?.score || 0
  const level = hoardingData?.level || 'healthy'
  const levelColor = LEVEL_COLORS[level] || '#7cfc6e'

  const barData = [
    { name: 'Opened', value: parseInt(today?.tabs_opened) || 0 },
    { name: 'Closed', value: parseInt(today?.tabs_closed) || 0 },
    { name: 'Switches', value: parseInt(today?.tab_switches) || 0 },
    { name: 'Peak', value: parseInt(today?.peak_tabs) || 0 },
  ]

  const pieData = domainData?.domains?.map(d => ({
    name: d.domain,
    value: parseInt(d.visits),
    category: d.category
  })) || []

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <p style={s.badge}>TAB AWARENESS</p>
        <h1 style={s.title}>Your Tab Usage Today</h1>
        <p style={s.sub}>Live data from your browser</p>
      </div>

      {/* Stat Cards */}
      <div style={s.grid4}>
        <div style={{...s.card, borderTopColor:'#00e5ff'}}>
          <p style={s.clabel}>TABS OPENED</p>
          <p style={{...s.cval, color:'#00e5ff'}}>{today?.tabs_opened || 0}</p>
        </div>
        <div style={{...s.card, borderTopColor:'#7cfc6e'}}>
          <p style={s.clabel}>TABS CLOSED</p>
          <p style={{...s.cval, color:'#7cfc6e'}}>{today?.tabs_closed || 0}</p>
        </div>
        <div style={{...s.card, borderTopColor:'#c77dff'}}>
          <p style={s.clabel}>TAB SWITCHES</p>
          <p style={{...s.cval, color:'#c77dff'}}>{today?.tab_switches || 0}</p>
        </div>
        <div style={{...s.card, borderTopColor:'#ff6b35'}}>
          <p style={s.clabel}>PEAK TABS</p>
          <p style={{...s.cval, color:'#ff6b35'}}>{today?.peak_tabs || 0}</p>
        </div>
      </div>

      {/* Hoarding Score */}
      <div style={{...s.card, borderTopColor: levelColor, marginBottom:'24px'}}>
        <p style={s.clabel}>🧠 HOARDING SCORE</p>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <div style={{flex:1, background:'#1e2535', borderRadius:'4px', height:'12px', overflow:'hidden'}}>
            <div style={{width:`${score}%`, height:'100%', background: levelColor, transition:'width 0.5s ease'}}/>
          </div>
          <p style={{fontSize:'28px', fontWeight:'800', color: levelColor, margin:0}}>{score}</p>
        </div>
        <p style={{color: levelColor, fontSize:'12px', marginTop:'6px', textTransform:'capitalize'}}>
          ● {level} — {
            level === 'healthy' ? 'Great job keeping tabs under control!' :
            level === 'mild' ? 'A few too many tabs open.' :
            level === 'moderate' ? 'Consider closing some tabs.' :
            'Tab hoarding detected! Time to clean up.'
          }
        </p>
      </div>

      {/* Charts Row */}
      <div style={s.grid2}>

        {/* Bar Chart */}
        <div style={s.chartBox}>
          <p style={s.clabel}>📊 TODAY AT A GLANCE</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535"/>
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize:11}}/>
              <YAxis stroke="#64748b" tick={{fontSize:11}}/>
              <Tooltip contentStyle={{background:'#0d1117', border:'1px solid #1e2535'}}/>
              <Bar dataKey="value" fill="#00e5ff" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={s.chartBox}>
          <p style={s.clabel}>🌐 DOMAINS VISITED</p>
          {pieData.length === 0 ? (
            <p style={{color:'#64748b', fontSize:'12px', marginTop:'16px'}}>
              Browse some websites and data will appear here!
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.category] || '#64748b'}/>
                  ))}
                </Pie>
                <Tooltip contentStyle={{background:'#0d1117', border:'1px solid #1e2535'}}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Domain List */}
      <div style={{...s.chartBox, marginBottom:'24px'}}>
        <p style={s.clabel}>🏆 TOP DOMAINS TODAY</p>
        {domainData?.domains?.length === 0 || !domainData?.domains ? (
          <p style={{color:'#64748b', fontSize:'12px'}}>No domain data yet — browse some websites!</p>
        ) : (
          domainData.domains.map((d, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'8px 0', borderBottom:'1px solid #1e2535'}}>
              <span style={{color:'#64748b', fontSize:'11px', minWidth:'20px'}}>#{i+1}</span>
              <span style={{flex:1, fontSize:'13px', color:'#e2e8f0'}}>{d.domain}</span>
              <span style={{fontSize:'11px', color: COLORS[d.category] || '#64748b', border:`1px solid ${COLORS[d.category] || '#64748b'}`, padding:'2px 8px', borderRadius:'3px'}}>{d.category}</span>
              <span style={{fontSize:'13px', color:'#00e5ff', fontWeight:'700'}}>{d.visits} visits</span>
            </div>
          ))
        )}
      </div>

      {/* Zombie Tabs */}
      <div style={{...s.chartBox, borderTopColor:'#ff6b35', marginBottom:'24px'}}>
        <p style={s.clabel}>🧟 ZOMBIE TABS (open 2+ hours)</p>
        {zombieData?.zombies?.length === 0 || !zombieData?.zombies ? (
          <p style={{color:'#64748b', fontSize:'12px'}}>✅ No zombie tabs detected!</p>
        ) : (
          zombieData.zombies.map((z, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'12px', padding:'8px 0', borderBottom:'1px solid #1e2535'}}>
              <span style={{flex:1, fontSize:'13px', color:'#e2e8f0'}}>{z.domain}</span>
              <span style={{fontSize:'11px', color:'#ff6b35'}}>{z.count} tabs</span>
            </div>
          ))
        )}
      </div>

      <p style={{textAlign:'center', fontSize:'11px', color:'#64748b'}}>
        Refreshes every 10 seconds
      </p>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', background:'#060810', color:'#e2e8f0', fontFamily:'monospace', padding:'40px 24px', maxWidth:'900px', margin:'0 auto' },
  header: { marginBottom:'32px', textAlign:'center' },
  badge: { fontSize:'10px', letterSpacing:'0.3em', color:'#00e5ff', marginBottom:'8px' },
  title: { fontSize:'32px', fontWeight:'800', margin:'0 0 8px 0', letterSpacing:'-0.02em' },
  sub: { color:'#64748b', fontSize:'13px' },
  grid4: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px', marginBottom:'24px' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' },
  card: { background:'#0d1117', border:'1px solid #1e2535', borderTop:'2px solid', borderRadius:'8px', padding:'20px' },
  clabel: { fontSize:'10px', letterSpacing:'0.15em', color:'#64748b', marginBottom:'8px', margin:'0 0 8px 0' },
  cval: { fontSize:'36px', fontWeight:'800', margin:'0' },
  chartBox: { background:'#0d1117', border:'1px solid #1e2535', borderTop:'2px solid #00e5ff', borderRadius:'8px', padding:'24px' },
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  )
}