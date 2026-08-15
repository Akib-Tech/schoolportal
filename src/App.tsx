import Header from './components/Header'
import Hero from './components/Hero'
import StatsBar from './components/StatsBar'
import SupportSection from './components/SupportSection'
import SmartRing from './components/SmartRing'
import CtaBanner from './components/CtaBanner'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <SupportSection />
        <SmartRing />
        <CtaBanner />
      </main>
      <Footer />
    </>
  )
}

export default App
