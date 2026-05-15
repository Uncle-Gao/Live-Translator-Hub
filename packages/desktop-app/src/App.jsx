import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import useConfigStore from './store/configStore'

import useOverscrollBounce from './hooks/useOverscrollBounce'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ApiKeysPanel from './components/ApiKeysPanel'
import DictGeneratorPanel from './components/DictGeneratorPanel'
import CursorPanel from './components/CursorPanel/index'
import ClaudePanel from './components/ClaudePanel/index'
import UpdateNotification from './components/UpdateNotification'

function App() {
  const { t } = useTranslation()
  const { loadConfig, loading } = useConfigStore()
  const [activeTab, setActiveTab] = useState('cursor')
  const [cursorStatus, setCursorStatus] = useState(null)
  const [claudeStatus, setClaudeStatus] = useState(null)
  const [showSudoOverlay, setShowSudoOverlay] = useState(false)
  const [updateState, setUpdateState] = useState('idle')
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateProgress, setUpdateProgress] = useState(null)
  const [isUpdateMac, setIsUpdateMac] = useState(false)
  const [updateError, setUpdateError] = useState(null)
  
  const scrollRef = useRef(null)
  const bounceY = useOverscrollBounce(scrollRef)

  const fetchStatus = async () => {
    if (window.liveTranslatorAPI) {
      try { setCursorStatus(await window.liveTranslatorAPI.getCursorStatus()) } catch { setCursorStatus({ installed: false }) }
      try { setClaudeStatus(await window.liveTranslatorAPI.getClaudeStatus()) } catch { setClaudeStatus({ installed: false }) }
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  useEffect(() => {
    // fetchStatus is async — setState calls happen after await, not synchronously
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatus()

    if (window.liveTranslatorAPI) {
      window.liveTranslatorAPI.onSudoPrompt(() => setShowSudoOverlay(true))

      window.liveTranslatorAPI.onUpdateChecking(() => {
        setUpdateError(null)
        setUpdateState('checking')
      })
      window.liveTranslatorAPI.onUpdateAvailable((info) => {
        setUpdateError(null)
        setUpdateInfo(info)
        setUpdateState('available')
      })
      window.liveTranslatorAPI.onUpdateNotAvailable(() => {
        setUpdateError(null)
        setUpdateState('idle')
      })
      window.liveTranslatorAPI.onUpdateProgress((progress) => {
        setUpdateError(null)
        setUpdateProgress(progress)
        setUpdateState('downloading')
      })
      window.liveTranslatorAPI.onUpdateDownloaded((info) => {
        setUpdateError(null)
        if (info?.platform === 'darwin') setIsUpdateMac(true)
        setUpdateState('downloaded')
      })
      window.liveTranslatorAPI.onUpdateError((err) => {
        setUpdateError(err?.message || null)
        setUpdateState('error')
      })
    }
    return () => {
      if (window.liveTranslatorAPI) {
        window.liveTranslatorAPI.removeSudoListeners?.()
        window.liveTranslatorAPI.removeUpdateListeners?.()
      }
    }
  }, [])

  const handleCheckUpdate = async () => {
    if (!window.liveTranslatorAPI?.checkForUpdates) return
    setUpdateError(null)
    setUpdateState('checking')
    try {
      const result = await window.liveTranslatorAPI.checkForUpdates()
      if (!result.ok) {
        console.error('[Update]', result.error)
        setUpdateState('idle')
      }
    } catch (e) {
      console.error('[Update]', e.message)
      setUpdateState('idle')
    }
  }

  const getTitle = () => {
    switch(activeTab) {
      case 'cursor': return t('cursorEngine');
      case 'claude': return t('claudeEngine');
      case 'apikeys': return t('navApiKeys');
      case 'dictgen': return t('navDictGen');
      default: return t('appTitle');
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0D10] text-blue-400 font-mono text-sm">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full mb-4"
        />
        <span className="ml-4 tracking-[0.2em] uppercase">Loading Config...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full font-sans text-gray-200 overflow-hidden bg-[#0B0D10]">
      {/* Sudo Overlay */}
      <AnimatePresence>
        {showSudoOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1A1C1E] border border-white/10 p-10 rounded-[2rem] flex flex-col items-center max-w-sm text-center shadow-2xl"
            >
              <div className="w-16 h-16 mb-6 rounded-full border-4 border-blue-500/20 border-t-blue-400 animate-spin"></div>
              <h3 className="text-xl font-bold mb-3 text-white">{t('sudoTitle')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('sudoDesc') }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cursorStatus={cursorStatus}
        claudeStatus={claudeStatus}
        onCheckUpdate={handleCheckUpdate}
        updateChecking={updateState === 'checking'}
      />

      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

        <UpdateNotification
          state={updateState}
          info={updateInfo}
          progress={updateProgress}
          isMac={isUpdateMac}
          error={updateError}
          onDownload={() => window.liveTranslatorAPI?.downloadUpdate()}
          onInstall={() => window.liveTranslatorAPI?.installUpdate()}
          onDismiss={() => { setUpdateError(null); setUpdateState('idle'); }}
        />

        <Header title={getTitle()} />

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar" style={{ overscrollBehaviorY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <AnimatePresence mode="wait">
            <motion.div style={{ y: bounceY }}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              {activeTab === 'cursor' && <CursorPanel status={cursorStatus} setShowSudoOverlay={setShowSudoOverlay} refreshStatus={fetchStatus} setActiveTab={setActiveTab} />}
              {activeTab === 'claude' && <ClaudePanel status={claudeStatus} setShowSudoOverlay={setShowSudoOverlay} refreshStatus={fetchStatus} setActiveTab={setActiveTab} />}
              {activeTab === 'apikeys' && <ApiKeysPanel />}
              {activeTab === 'dictgen' && <DictGeneratorPanel />}
            </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
