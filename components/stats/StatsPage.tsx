import TabButtons from '@components/shared/TabButtons'
import TokenPage from '@components/token/TokenPage'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useViewport } from 'hooks/useViewport'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { breakpoints } from 'utils/theme'
import MangoStats from './MangoStats'
import PerpStats from './PerpStats'
import PerpStatsPage from './PerpStatsPage'
import SpotMarketsTable from './SpotMarketsTable'
import TokenStats from './TokenStats'

const TABS = ['tokens', 'perp-markets', 'spot-markets', 'mango-stats']

const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('tokens')
  const actions = mangoStore.getState().actions
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const fullWidthTabs = width ? width < breakpoints.lg : false
  const router = useRouter()
  const { market } = router.query
  const { token } = router.query

  useEffect(() => {
    if (group && (!perpStats || !perpStats.length)) {
      actions.fetchPerpStats()
    }
  }, [group, perpStats])

  const tabsWithCount: [string, number][] = useMemo(() => {
    return TABS.map((t) => [t, 0])
  }, [])
  return (
    <div className="pb-20 md:pb-16">
      {market ? (
        <PerpStatsPage />
      ) : token ? (
        <TokenPage />
      ) : (
        <>
          <div className="hide-scroll overflow-x-auto border-b border-th-bkg-3">
            <TabButtons
              activeValue={activeTab}
              fillWidth={fullWidthTabs}
              onChange={(v) => setActiveTab(v)}
              showBorders
              values={tabsWithCount}
            />
          </div>
          <TabContent activeTab={activeTab} />
        </>
      )}
    </div>
  )
}

export default StatsPage

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'tokens':
      return <TokenStats />
    case 'perp-markets':
      return <PerpStats />
    case 'spot-markets':
      return <SpotMarketsTable />
    case 'mango-stats':
      return <MangoStats />
    default:
      return <TokenStats />
  }
}
