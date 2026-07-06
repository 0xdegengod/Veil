import {
  createInstance,
  initSDK,
  SepoliaConfig,
  type FhevmInstance,
} from '@zama-fhe/relayer-sdk/web'
import { ZAMA_NETWORKS } from '../zama/network.ts'

let sdkInit: Promise<boolean> | null = null
let instance: FhevmInstance | null = null

async function ensureSdkReady(): Promise<void> {
  if (!sdkInit) {
    sdkInit = initSDK()
  }
  await sdkInit
}

export async function getFhevmInstance(): Promise<FhevmInstance> {
  if (!instance) {
    await ensureSdkReady()
    const network =
      import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() || ZAMA_NETWORKS.sepolia.rpcUrl
    instance = await createInstance({
      ...SepoliaConfig,
      network,
    })
  }
  return instance
}
