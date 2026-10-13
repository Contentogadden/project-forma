import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import Login from './Login';
import RenaissanceArt from './RenaissanceArt';
import Workspace from './Workspace';
import { logout } from './auth';
import type { Viewer } from './classroom/api';
import { practiceDoors, type PracticeTarget } from './practiceNavigation';
import './showcase.css';

export default function App() {
  const [artLibrary, setArtLibrary] = useState<string[]>([]);
  useEffect(() => {
    const c = new AbortController();
    fetch('/api/v1/art', { signal: c.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((paths) => {
        if (Array.isArray(paths))
          setArtLibrary(paths.filter((p) => typeof p === 'string' && p.startsWith('/api/v1/art/')));
      })
      .catch(() => {});
    return () => c.abort();
  }, []);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState<PracticeTarget | undefined>();
  const openPractice = (target: PracticeTarget) => {
    setPracticeTarget(target);
    if (viewer) setWorkspaceOpen(true);
    else setLoginOpen(true);
  };
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setViewer)
      .catch(() => {});
  }, []);
  return (
    <main className="showcase">
      <motion.div className="progress" style={{ scaleX }} />
      <nav>
        <a className="brand" href="#top">
          PROJECT FORMA <span>PF–01</span>
        </a>
        <div className="navlinks">
          <a href="#program">Программа</a>
          <a href="#task">Практика</a>
          <button onClick={() => (viewer ? setWorkspaceOpen(true) : setLoginOpen(true))}>
            {viewer ? 'Мой кабинет' : 'Войти'}
          </button>
        </div>
      </nav>
      <section className="hero" id="top">
        <RenaissanceArt src={artLibrary[0]} />
        <div className="hero-title">
          <h1>
            Музыка.
            <br />
            <i>Изнутри.</i>
          </h1>
          <p>Практика для взрослых музыкантов и студентов консерваторий.</p>
          <div className="hero-actions">
            <button onClick={() => (viewer ? setWorkspaceOpen(true) : setLoginOpen(true))}>
              {viewer ? 'Мой кабинет' : 'Войти'}
            </button>
          </div>
        </div>
      </section>
      <section className="showcase-program" id="program">
        <div>
          <h2>От слуха к анализу.</h2>
          <p>
            Атлас знаний и практика конкретных навыков. Свои задания и обратная связь — для
            преподавателей.
          </p>
        </div>
        <div>
          <div className="epoch-line">
            {[
              ['ear', 'Слух'],
              ['harmony', 'Гармония'],
              ['polyphony', 'Полифония'],
              ['form', 'Форма'],
              ['research', 'Исследование'],
            ].map(([domain, name]) => (
              <button key={domain} onClick={() => openPractice({ domain })}>
                {name}
              </button>
            ))}
          </div>
          <div className="showcase-aspects">
            <button onClick={() => openPractice({})}>Все 14 областей →</button>
          </div>
        </div>
      </section>
      <section className="art-atlas" id="task" aria-label="Практика по пяти аспектам музыки">
        <div className="atlas-heading">
          <h2>Пять сторон музыки</h2>
          <p>Выберите тему — откроется звуковое задание.</p>
        </div>
        <div className="atlas-gallery functional-gallery">
          {practiceDoors.map((door, index) => (
            <button
              key={door.aspect}
              className="atlas-door"
              onClick={() => openPractice({ task: door.task, aspect: door.aspect })}
              aria-label={`${door.aspect}: ${door.action}`}
            >
              <img
                src={artLibrary[index + 1] ?? door.image}
                onError={(e) => {
                  e.currentTarget.src = door.image;
                }}
                alt={`Художественная иллюстрация: ${door.aspect}`}
                loading="lazy"
              />
              <span className="atlas-door-label">
                <strong>{door.aspect}</strong>
                <small>{door.action} →</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="access">
        <div>
          <h2>{viewer ? `Здравствуйте, ${viewer.displayName}` : 'Учиться вместе'}</h2>
          <p>Задания, ответы и обратная связь — в одном кабинете.</p>
        </div>
        {viewer ? (
          <Workspace
            viewer={viewer}
            open={() => setWorkspaceOpen(true)}
            logout={() => logout(setViewer)}
          />
        ) : (
          <button className="access-button" onClick={() => setLoginOpen(true)}>
            Открыть кабинет →
          </button>
        )}
      </section>
      <footer>
        <b>PROJECT FORMA</b>
        <span>© 2026 · 18+</span>
        <span>Музыкальная практика</span>
      </footer>
      <AnimatePresence>
        {loginOpen && (
          <Login
            close={() => setLoginOpen(false)}
            success={(v) => {
              setViewer(v);
              setLoginOpen(false);
              setWorkspaceOpen(true);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {workspaceOpen && viewer && (
          <Dashboard
            viewer={viewer}
            target={practiceTarget}
            close={() => {
              setWorkspaceOpen(false);
              setPracticeTarget(undefined);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
