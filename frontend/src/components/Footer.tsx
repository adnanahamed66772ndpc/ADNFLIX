import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-elevated border-t border-border mt-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="font-display text-2xl text-primary mb-4 block">ADNFLIX</span>
            <p className="text-sm text-muted-foreground">
              Your premier destination for movies and TV shows. Stream anywhere, anytime.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/browse" className="hover:text-foreground transition-colors">All Titles</Link></li>
              <li><Link to="/browse?type=movie" className="hover:text-foreground transition-colors">Movies</Link></li>
              <li><Link to="/browse?type=series" className="hover:text-foreground transition-colors">TV Shows</Link></li>
              <li><Link to="/browse?genre=action" className="hover:text-foreground transition-colors">Action</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/account" className="hover:text-foreground transition-colors">My Account</Link></li>
              <li><Link to="/account?tab=subscription" className="hover:text-foreground transition-colors">Subscription</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/docs" className="hover:text-foreground transition-colors">API Docs</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ADNFLIX. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
