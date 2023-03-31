import { useEffect, useMemo, useState } from 'react'
import sumBy from 'lodash/sumBy'
import { useTranslation } from 'next-i18next'
import { Connection } from '@solana/web3.js'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useInterval from './shared/useInterval'
import { Popover } from '@headlessui/react'

interface Status {
  heartbeat: number
  tps: number
}

const tpsAlertThreshold = 1000
const tpsWarningThreshold = 1300

const getStatus = async (
  connection: Connection,
  setStatus: (x: Status | null) => void
) => {
  try {
    const samples = 2
    const response = await connection.getRecentPerformanceSamples(samples)
    const totalSecs = sumBy(response, 'samplePeriodSecs')
    const totalTransactions = sumBy(response, 'numTransactions')
    const tps = totalTransactions / totalSecs
    // const heartbeat = connection._rpcWebSocketHeartbeat
    const heartbeat = 100

    setStatus({ heartbeat, tps })
  } catch {
    console.warn('Unable to fetch TPS')
  }
}

const getDbStatus = async (setDbGood: (x: boolean) => void) => {
  try {
    const response = await fetch('https://api.mngo.cloud/data/health/db')
    const parsed = await response.json()
    if (parsed === 200) {
      setDbGood(true)
    }
  } catch {
    console.log('failed to get db status')
  }
}

const PlatformStatus = () => {
  const connection = mangoStore((s) => s.connection)
  const [dbGood, setDbGood] = useState(true)
  const [status, setStatus] = useState<Status | null>(null)
  const { t } = useTranslation('common')

  useEffect(() => {
    getStatus(connection, setStatus)
  }, [])

  useInterval(() => {
    getStatus(connection, setStatus)
    getDbStatus(setDbGood)
  }, 15 * 1000)

  const [statusColor, statusText] = useMemo(() => {
    let color
    let statusText
    if (!status) {
      color = 'bg-th-fgd-3'
      statusText = '–'
    } else if (status.tps < tpsAlertThreshold) {
      color = 'bg-th-error'
      statusText = 'degraded'
    } else if (
      (status.tps > tpsAlertThreshold && status.tps < tpsWarningThreshold) ||
      !dbGood
    ) {
      color = 'bg-th-warning'
      statusText = 'operational'
    } else {
      color = 'bg-th-success'
      statusText = 'operational'
    }
    return [color, statusText]
  }, [dbGood, status])

  if (CLUSTER == 'mainnet-beta') {
    return (
      <Popover>
        <div className="relative">
          <Popover.Button className="text-th-fgd-3 md:hover:text-th-fgd-2">
            <div className="flex items-center">
              <div className="relative mr-1 h-3 w-3">
                <div
                  className={`absolute top-0.5 left-0.5 h-2 w-2 rounded-full ${statusColor}`}
                />
                <div
                  className={`absolute h-3 w-3 rounded-full opacity-40 ${statusColor}`}
                />
              </div>
              <span>{t(statusText)}</span>
            </div>
          </Popover.Button>
          <Popover.Panel className="absolute top-8 z-20 w-64 space-y-1.5 rounded-md bg-th-bkg-2 px-4 py-2.5">
            <div className="flex justify-between">
              <p>{t('solana-tps')}</p>
              <p className="font-mono text-th-fgd-2">
                {status?.tps?.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="flex justify-between">
              <p>{t('rpc-heartbeat')}</p>
              <p className="font-mono text-th-fgd-2">{status?.heartbeat}ms</p>
            </div>
            <div className="flex justify-between">
              <p>{t('offchain-data')}</p>
              <p className="text-th-fgd-2">
                {dbGood ? t('okay') : t('unavailable')}
              </p>
            </div>
          </Popover.Panel>
        </div>
      </Popover>
    )
  } else {
    return null
  }
}

export default PlatformStatus
