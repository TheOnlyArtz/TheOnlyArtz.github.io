export default function TopNav() {
  return (
    <header className="topnav" data-od-id="topnav">
      <div className="container topnav-inner">
        <div className="topnav-brand">
          <span className="logo">ג'ב</span>
          <nav>
            <a href="#trends" data-od-id="nav-trends">מגמות בזמן אמת</a>
            <a href="#method" data-od-id="nav-method">איך זה עובד</a>
          </nav>
        </div>
        <span className="live" data-od-id="live-badge"><i aria-hidden="true" />לייב</span>
      </div>
    </header>
  );
}
