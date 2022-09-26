import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { SpotBalances } from 'types'
import mangoStore from './mangoStore'

const spotBalancesUpdater = (_newState: any, _prevState: any) => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  const group = mangoStore.getState().group
  const openOrdersAccounts =
    mangoStore.getState().mangoAccount.openOrderAccounts
  const set = mangoStore.getState().set

  if (!mangoAccount || !group) return

  const balances: SpotBalances = {}

  for (const serumMarket of mangoAccount.serum3Active()) {
    const market = group.getSerum3MarketByIndex(serumMarket.marketIndex)
    if (!market) continue
    const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
      oo.market.equals(market.serumMarketExternal)
    )

    let baseTokenUnsettled = 0
    let quoteTokenUnsettled = 0
    let baseTokenLockedInOrder = 0
    let quoteTokenLockedInOrder = 0
    if (openOrdersAccForMkt) {
      baseTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt.baseTokenFree.toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex).mintDecimals
      )
      quoteTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt.quoteTokenFree
          // @ts-ignore
          .add(openOrdersAccForMkt['referrerRebatesAccrued'])
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex).mintDecimals
      )
      baseTokenLockedInOrder = toUiDecimals(
        openOrdersAccForMkt.baseTokenTotal
          .sub(openOrdersAccForMkt.baseTokenFree)
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex).mintDecimals
      )
      quoteTokenLockedInOrder = toUiDecimals(
        openOrdersAccForMkt.quoteTokenTotal
          .sub(openOrdersAccForMkt.quoteTokenFree)
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex).mintDecimals
      )
    }

    let quoteBalances =
      balances[
        market.getSerum3ExternalMarket(group)!.quoteMintAddress.toString()
      ]
    if (!quoteBalances) {
      quoteBalances = balances[
        market.getSerum3ExternalMarket(group)!.quoteMintAddress.toString()
      ] = { inOrders: 0, unsettled: 0 }
    }
    quoteBalances.inOrders += quoteTokenLockedInOrder || 0
    quoteBalances.unsettled += quoteTokenUnsettled

    let baseBalances =
      balances[
        market.getSerum3ExternalMarket(group)!.baseMintAddress.toString()
      ]
    if (!baseBalances) {
      baseBalances = balances[
        market.getSerum3ExternalMarket(group)!.baseMintAddress.toString()
      ] = { inOrders: 0, unsettled: 0 }
    }
    baseBalances.inOrders += baseTokenLockedInOrder
    baseBalances.unsettled += baseTokenUnsettled
  }

  set((s) => {
    s.mangoAccount.spotBalances = balances
  })
}

export default spotBalancesUpdater
