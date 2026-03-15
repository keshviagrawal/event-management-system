import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="layout-container">{children}</div>
    </div>
  );
}