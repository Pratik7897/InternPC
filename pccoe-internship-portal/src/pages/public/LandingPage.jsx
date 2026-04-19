import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Users, Briefcase, Building, Trophy, Search, ChevronRight, Megaphone } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import Footer from '../../components/layout/Footer'
import ThemeToggle from '../../components/ui/ThemeToggle'

const stats = [
  { label: 'Total Students', value: '4,500+', icon: Users },
  { label: 'Active Internships', value: '120+', icon: Briefcase },
  { label: 'Companies Visited', value: '350+', icon: Building },
  { label: 'Placements', value: '95%', icon: Trophy },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300">
      <div className="bg-accent-blue text-white text-sm py-2 px-4 flex items-center justify-center gap-2">
        <Megaphone className="w-4 h-4" />
        <span className="font-medium flex-1 text-center md:flex-none">
          Latest Update: Upcoming Placement Drive from Google next month! Check the portal for details.
        </span>
      </div>

      <header className="absolute top-10 right-6 z-50">
        <ThemeToggle />
      </header>

      <section className="relative pt-20 pb-32 px-6 flex-1 flex flex-col justify-center items-center text-center max-w-7xl mx-auto w-full z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 mx-auto bg-background/80 dark:bg-white/10 rounded-2xl flex items-center justify-center border border-border dark:border-white/20 shadow-[var(--glow)] backdrop-blur-md transition-all duration-300">
            <img src="/logo.png" alt="PCCOE Logo" className="w-20 h-20 object-contain" />
          </div>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-7xl font-heading font-bold mb-6 tracking-tight leading-tight text-text-primary transition-colors duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          Launch Your Career <br className="hidden md:block" />
          <span className="text-gradient">from PCCOE</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-body transition-colors duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          The official gateway for PCCOE students to connect with world-class internship opportunities, build outstanding profiles, and kickstart their professional journeys.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <Button size="lg" asChild className="w-full sm:w-auto text-base">
            <Link to="/login">
              Student Login <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-base glass dark:glass hover:border-accent-blue/50 dark:hover:border-accent-blue/50 transition-all duration-300">
            <Link to="/directory">
              <Search className="mr-2 w-4 h-4" /> Browse Students (Companies)
            </Link>
          </Button>
        </motion.div>
      </section>

      <section className="border-y border-border dark:border-white/10 bg-secondary/30 dark:bg-secondary/30 backdrop-blur-xl relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-12 h-12 mx-auto bg-accent-blue/10 dark:bg-accent-blue/10 rounded-full flex items-center justify-center text-accent-blue mb-4 transition-colors duration-300">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-heading font-bold text-text-primary mb-1 transition-colors duration-300">{stat.value}</h3>
                <p className="text-sm text-text-secondary font-medium transition-colors duration-300">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 text-text-primary transition-colors duration-300">Bridging Talent & Opportunity</h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg transition-colors duration-300">A unified platform designed specifically for the needs of our students and recruiting partners.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <motion.div 
            className="glass-card p-8 md:p-10 transition-all duration-300"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-12 bg-accent-blue/20 dark:bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue mb-6 transition-colors duration-300">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-4 text-text-primary transition-colors duration-300">For Students</h3>
            <ul className="space-y-4 text-text-secondary transition-colors duration-300">
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-teal shrink-0 mt-0.5" /> 
                Build a comprehensive digital profile showcasing your skills, projects, and achievements.
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-teal shrink-0 mt-0.5" /> 
                Upload and manage key documents including resumes and video introductions.
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-teal shrink-0 mt-0.5" /> 
                Track applications and directly apply to vetted, exclusive internal internship listings.
              </li>
            </ul>
          </motion.div>

          <motion.div 
            className="glass-card p-8 md:p-10 transition-all duration-300"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-12 h-12 bg-accent-gold/20 dark:bg-accent-gold/20 rounded-xl flex items-center justify-center text-accent-gold mb-6 transition-colors duration-300">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-heading font-bold mb-4 text-text-primary transition-colors duration-300">For Companies</h3>
            <ul className="space-y-4 text-text-secondary transition-colors duration-300">
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" /> 
                Browse a curated, publicly accessible directory of PCCOE's brightest talent.
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" /> 
                Filter candidates easily by branch, year of study, technical skills, and academic performance.
              </li>
              <li className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-accent-gold shrink-0 mt-0.5" /> 
                Directly connect with students via integrated LinkedIn, GitHub, and Portfolio communication channels.
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
