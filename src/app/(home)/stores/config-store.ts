import { create } from 'zustand'
import siteContent from '@/config/site-content.json'

export type SiteContent = typeof siteContent

interface ConfigStore {
	siteContent: SiteContent
	regenerateKey: number
	setSiteContent: (content: SiteContent) => void
	resetSiteContent: () => void
	regenerateBubbles: () => void
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
	siteContent: { ...siteContent },
	regenerateKey: 0,
	setSiteContent: (content: SiteContent) => {
		set({ siteContent: content })
	},
	resetSiteContent: () => {
		set({ siteContent: { ...siteContent } })
	},
	regenerateBubbles: () => {
		set(state => ({ regenerateKey: state.regenerateKey + 1 }))
	}
}))

