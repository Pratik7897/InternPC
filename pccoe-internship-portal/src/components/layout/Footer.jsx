export default function Footer() {
  return (
    <footer className="border-t bg-secondary/50 backdrop-blur-md mt-auto transition-colors duration-300" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-heading font-bold text-accent-blue mb-4">PCCOE Placement Cell</h2>
            <p className="text-text-secondary leading-relaxed max-w-sm">
              Empowering students with industry-ready skills and connecting them to top-tier internship opportunities globally.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Quick Links</h3>
            <ul className="space-y-2 text-text-secondary">
              <li><a href="/directory" className="hover:text-accent-blue transition-colors">Student Directory</a></li>
              <li><a href="/internships" className="hover:text-accent-blue transition-colors">Browse Internships</a></li>
              <li><a href="/login" className="hover:text-accent-blue transition-colors">Student Login</a></li>
              <li><a href="/login" className="hover:text-accent-blue transition-colors">Admin Portal</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-text-primary mb-4">Contact</h3>
            <ul className="space-y-2 text-text-secondary">
              <li>Sector - 26, Pradhikaran, Nigdi,</li>
              <li>Pune - 411044, Maharashtra, India.</li>
              <li className="pt-2">Email: placement@pccoepune.org</li>
              <li>Phone: +91-20-27653168</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-text-secondary transition-colors duration-300" style={{ borderTop: '1px solid var(--border)' }}>
          <p>© {new Date().getFullYear()} Pimpri Chinchwad College of Engineering. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-accent-blue transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-accent-blue transition-colors">Twitter</a>
            <a href="#" className="hover:text-accent-blue transition-colors">Instagram</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
