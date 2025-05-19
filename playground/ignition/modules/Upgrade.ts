import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'
import demoModule from './Demo'

const upgradeModule = buildModule('UpgradeModule', (m) => {
  const proxyAdminOwner = m.getAccount(0)

  const { proxyAdmin, proxy } = m.useModule(demoModule)

  const demoV2 = m.contract('DemoV2')

  const encodedFunctionCall = m.encodeFunctionCall(demoV2, 'setName', [
    'Example Name',
  ])

  m.call(proxyAdmin, 'upgradeAndCall', [proxy, demoV2, encodedFunctionCall], {
    from: proxyAdminOwner,
  })

  return { proxyAdmin, proxy }
})

const demoV2Module = buildModule('DemoV2Module', (m) => {
  const { proxy, proxyAdmin } = m.useModule(upgradeModule)

  const demo = m.contractAt('DemoV2', proxy)

  return { demo, proxy, proxyAdmin }
})

export default demoV2Module
