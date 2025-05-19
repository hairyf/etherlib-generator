import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CounterModule', (m) => {
  const counter = m.contract('Counter')
  m.call(counter, 'incBy', [5n])

  m.call(counter, 'inc')

  return { counter }
})
