
import React from 'react';

const SharedFooter: React.FC = () => {
  return (
    <footer className="text-center text-sm text-muted-foreground p-4 bg-white border-t">
        <a href="https://adavallan.com/index.php" target="_blank" className="hover:text-primary transition-colors">Adavallan Isaiyalayam</a> © {new Date().getFullYear()} All Rights Reserved. Powered by <a href="http://www.wezads.com" target="_blank" className="hover:text-primary transition-colors">WEZADS</a>
    </footer>
  );
};

export default SharedFooter;
