import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Sayfa yolu (URL) her değiştiğinde scroll'u en başa (0,0) çek
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Bu bileşen görsel bir şey render etmez
};

export default ScrollToTop;