import { ChangeEvent, useEffect, useRef, useState } from 'react'

const LeverageSlider = ({
  amount,
  leverageMax,
  onChange,
  step,
}: {
  amount: number
  leverageMax: number
  onChange: (x: string) => any
  step: number
}) => {
  const [value, setValue] = useState(0)
  const inputEl = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputEl.current) {
      const target = inputEl.current
      const min = parseFloat(target.min)
      const max = leverageMax

      target.style.backgroundSize =
        max - min === 0
          ? '0% 100%'
          : ((value - min) * 100) / (max - min) + '% 100%'
    }
  }, [leverageMax, value])

  useEffect(() => {
    if (amount) {
      setValue(amount)
    }
  }, [amount])

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target
    const min = parseFloat(target.min)
    const max = parseFloat(target.max)
    const val = parseFloat(target.value)

    target.style.backgroundSize = ((val - min) * 100) / (max - min) + '% 100%'

    onChange(e.target.value)
    setValue(parseFloat(e.target.value))
  }

  return (
    <>
      <label htmlFor="default-range" className="block text-sm"></label>
      <input
        ref={inputEl}
        id="default-range"
        type="range"
        min="0"
        max={leverageMax}
        step={step}
        className="w-full"
        onChange={handleSliderChange}
        value={value}
      ></input>
    </>
  )
}

// export const BorrowLeverageSlider = ({
//   amount,
//   tokenMax,
//   onChange,
// }: {
//   amount: number
//   tokenMax: number
//   onChange: (x: string) => any
// }) => {
//   return (
//     <>
//       <LeverageSlider
//         amount={amount}
//         leverageMax={tokenMax}
//         onChange={onChange}
//       />
//     </>
//   )
// }

export default LeverageSlider