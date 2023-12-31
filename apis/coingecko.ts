type CoingeckoOhlcv = [
  time: number,
  open: number,
  high: number,
  low: number,
  close: number
][]

export type ChartDataItem = {
  time: number
  price: number
  inputTokenPrice: number
  outputTokenPrice: number
}

export const fetchChartData = async (
  baseTokenId: string | undefined,
  quoteTokenId: string | undefined,
  daysToShow: string
): Promise<ChartDataItem[]> => {
  if (!baseTokenId || !quoteTokenId) return []
  try {
    const [inputResponse, outputResponse] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/${baseTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
      ),
      fetch(
        `https://api.coingecko.com/api/v3/coins/${quoteTokenId}/ohlc?vs_currency=usd&days=${daysToShow}`
      ),
    ])

    const [inputTokenData, outputTokenData]: [CoingeckoOhlcv, CoingeckoOhlcv] =
      await Promise.all([inputResponse.json(), outputResponse.json()])

    if (Array.isArray(inputTokenData) && Array.isArray(outputTokenData)) {
      const parsedData: ChartDataItem[] = []
      for (const inputTokenCandle of inputTokenData) {
        const outputTokenCandle = outputTokenData.find(
          (outputTokenCandle) => outputTokenCandle[0] === inputTokenCandle[0]
        )
        if (outputTokenCandle) {
          if (['usd-coin', 'tether'].includes(quoteTokenId)) {
            parsedData.push({
              time: inputTokenCandle[0],
              price: inputTokenCandle[4] / outputTokenCandle[4],
              inputTokenPrice: inputTokenCandle[4],
              outputTokenPrice: outputTokenCandle[4],
            })
          } else {
            parsedData.push({
              time: inputTokenCandle[0],
              price: outputTokenCandle[4] / inputTokenCandle[4],
              inputTokenPrice: inputTokenCandle[4],
              outputTokenPrice: outputTokenCandle[4],
            })
          }
        }
      }
      return parsedData
    } else {
      return []
    }
  } catch {
    return []
  }
}
