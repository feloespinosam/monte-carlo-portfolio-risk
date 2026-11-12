import { NavLink } from "react-router-dom";
import { SECTIONS } from "../../routes/sections";

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <span className="sidebar-heading">Navigation</span>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            end={section.end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-link-dot" aria-hidden="true" />
            {section.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
