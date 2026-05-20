import { Link } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  FlaskConical,
  Gift,
  Layers,
  MonitorPlay,
  Stethoscope,
  Target,
  Wrench,
  Newspaper,
  MessageCircle,
} from 'lucide-react'
import { StageTimeline } from '../components/StageTimeline'
import { TRAINING_STAGES } from '../data/trainingSystem'
import { TRAINING_CONTENTS } from '../data/content'
const FEATURES = [
  { to: '/system', icon: Layers, title: '培训体系总览', desc: '四级递进，一键衔接规划与内容' },
  { to: '/plan', icon: Target, title: '我的培训规划', desc: '入学测评，专属周/月学习任务' },
  { to: '/content', icon: BookOpen, title: '分阶段培训内容', desc: '理论·国产DSA·虚拟实操·案例' },
  { to: '/virtual', icon: MonitorPlay, title: '虚拟实操演练', desc: '1:1导管室与国产DSA模拟' },
]

export function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-teal-800 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
            <div className="relative z-10">
              <p className="mb-2 text-sm font-medium text-primary-200">青笋 · 介入培训平台</p>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                介入医生系统化自学平台
                <span className="mt-2 block text-primary-100">
                  从规培到独立手术，按体系成长，按规划进阶
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-primary-100/90 md:text-lg">
                四级培训体系 · 专属规划 · 精准内容 · 虚拟实操，让每一步成长都有迹可循
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/system" className="btn-primary bg-white text-primary-800 hover:bg-primary-50">
                  了解培训体系
                </Link>
                <Link to="/plan" className="btn-secondary border-white/30 text-white hover:bg-white/10">
                  制定我的规划
                </Link>
              </div>
            </div>

            <div className="relative flex items-end justify-center lg:justify-end">
              <img
                src="/images/hero-dsa-carm.png?v=3"
                alt="国产 DSA C臂与影像系统"
                className="w-full max-w-xl object-contain drop-shadow-2xl mix-blend-screen max-h-[240px] sm:max-h-[300px] lg:max-h-[380px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="section-title">四级培训体系</h2>
        <p className="section-subtitle">培训体系 → 培训规划 → 培训内容，点击阶段直达对应模块</p>
        <div className="mt-6">
          <StageTimeline />
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="section-title">核心功能</h2>
          <p className="section-subtitle">一步直达，无中间过渡页</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <Link key={f.to} to={f.to} className="card group flex gap-4 active:scale-[0.99]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 group-hover:bg-primary-600 group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="section-title">培训内容速览</h2>
        <p className="section-subtitle">按阶段浏览核心任务与学习内容</p>
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 snap-x">
          {TRAINING_STAGES.map((stage) => {
            const contents = TRAINING_CONTENTS.filter((c) => c.stageId === stage.id).slice(0, 2)
            return (
              <article
                key={stage.id}
                className="min-w-[280px] snap-start card flex flex-col"
              >
                <span className={`inline-block w-fit rounded-full bg-gradient-to-r ${stage.color} px-3 py-0.5 text-xs font-medium text-white`}>
                  {stage.name}
                </span>
                <p className="mt-2 text-sm text-slate-600">{stage.coreGoal}</p>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-slate-500">
                  {contents.map((c) => (
                    <li key={c.id}>· {c.title}</li>
                  ))}
                </ul>
                <Link
                  to={`/content?stage=${stage.id}`}
                  className="btn-primary mt-4 w-full text-center"
                >
                  进入学习
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-4">
            <Gift className="h-10 w-10 text-amber-600" />
            <CalendarCheck className="h-10 w-10 text-orange-500" />
            <p className="text-sm font-medium text-slate-800 md:text-base">
              完成阶段培训规划，打卡领积分，兑换对应阶段高级资源，助力体系进阶
            </p>
          </div>
          <Link to="/incentives" className="btn-secondary shrink-0">
            查看积分规则
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="section-title">辅助服务</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link to="/experts" className="card text-center active:scale-[0.99]">
            <Stethoscope className="mx-auto h-8 w-8 text-primary-600" />
            <h3 className="mt-2 font-semibold">专家咨询</h3>
            <p className="mt-1 text-sm text-slate-500">直播授课、病例点评、规划建议</p>
          </Link>
          <Link to="/tools" className="card text-center active:scale-[0.99]">
            <Wrench className="mx-auto h-8 w-8 text-primary-600" />
            <h3 className="mt-2 font-semibold">实用工具</h3>
            <p className="mt-1 text-sm text-slate-500">解剖查询、器械库、手术量统计</p>
          </Link>
          <Link to="/news" className="card text-center active:scale-[0.99]">
            <Newspaper className="mx-auto h-8 w-8 text-primary-600" />
            <h3 className="mt-2 font-semibold">行业资讯</h3>
            <p className="mt-1 text-sm text-slate-500">指南更新、前沿技术、政策动态</p>
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link to="/assessment" className="text-sm text-primary-600 hover:underline">
            培训考核
          </Link>
          <Link to="/community" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> 交流互动
          </Link>
          <Link to="/incentives" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            <FlaskConical className="h-4 w-4" /> 学习激励
          </Link>
        </div>
      </section>
    </>
  )
}
