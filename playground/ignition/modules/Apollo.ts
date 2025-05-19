import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('Apollo', (m) => {
  const params = m.getParameter('')
  const apollo = m.contract('Rocket', [params])

  m.call(apollo, 'launch', [])

  return { apollo }
})
