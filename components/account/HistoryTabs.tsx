import { useEffect, useState } from 'react'
import SwapHistoryTable from '../swap/SwapHistoryTable'
import TradeHistory from '@components/trade/TradeHistory'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import ActivityFeedTable from './ActivityFeedTable'
import SecondaryTabBar from '@components/shared/SecondaryTabBar'

const TABS = ['activity:activity-feed', 'activity:swaps', 'activity:trades']

const HistoryTabs = () => {
  const [activeTab, setActiveTab] = useState('activity:activity-feed')
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()

  useEffect(() => {
    if (actions && mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  return (
    <>
      <SecondaryTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={TABS}
      />
      <TabContent activeTab={activeTab} />
    </>
  )
}

const TabContent = ({ activeTab }: { activeTab: string }) => {
  switch (activeTab) {
    case 'activity:activity-feed':
      return <ActivityFeedTable />
    case 'activity:swaps':
      return <SwapHistoryTable />
    case 'activity:trades':
      return <TradeHistory />
    default:
      return <ActivityFeedTable />
  }
}

export default HistoryTabs
