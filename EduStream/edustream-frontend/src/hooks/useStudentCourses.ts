import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import type { StudentModule } from '../types/studentModule';

export function useStudentCourses(autoLoad = true) {
  const [modules, setModules] = useState<StudentModule[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [playingModule, setPlayingModule] = useState<StudentModule | null>(null);

  const loadModules = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/mes-inscriptions');
      setModules(res.data.data || res.data);
    } catch {
      if (!silent) setModules([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadModules();
  }, [autoLoad, loadModules]);

  const openCourse = async (mod: StudentModule) => {
    try {
      const res = await api.get(`/modules/${mod.id}`);
      setPlayingModule(res.data);
    } catch {
      setPlayingModule(mod);
    }
  };

  const closeCourse = () => {
    setPlayingModule(null);
    loadModules(true);
  };

  const refreshProgress = () => loadModules(true);

  return {
    modules, loading, playingModule,
    openCourse, closeCourse, refreshProgress,
    loadModules, setModules,
  };
}
