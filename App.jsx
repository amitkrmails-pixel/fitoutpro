import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Briefcase, ExternalLink, Filter, 
  Hammer, CheckCircle, Clock, Building2, ChevronRight, 
  Bookmark, Share2, DollarSign, Layout, PencilRuler, HardHat,
  X
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';

// Global variables provided by the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'fitout-pro-default';

const App = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('All');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // 1. Initialize Firebase and Auth
  useEffect(() => {
    if (!firebaseConfig) {
      setLoading(false); // Fallback if no config
      return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Fetch Real Jobs from Firestore
  useEffect(() => {
    if (!user || !firebaseConfig) return;

    const db = getFirestore();
    // Path: /artifacts/{appId}/public/data/jobs
    const jobsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'jobs');
    
    const unsubscribe = onSnapshot(query(jobsCollection), 
      (snapshot) => {
        const jobsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory (Rule 2: No complex queries)
        const sortedJobs = jobsList.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
        
        setJobs(sortedJobs);
        if (sortedJobs.length > 0 && !selectedJob) setSelectedJob(sortedJobs[0]);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setShowMobileDetail(true);
  };

  const toggleApply = (id) => {
    const newApplied = new Set(appliedJobs);
    if (newApplied.has(id)) newApplied.delete(id);
    else newApplied.add(id);
    setAppliedJobs(newApplied);
  };

  const toggleSave = (id) => {
    const newSaved = new Set(savedJobs);
    if (newSaved.has(id)) newSaved.delete(id);
    else newSaved.add(id);
    setSavedJobs(newSaved);
  };

  const filteredJobs = jobs.filter(job => 
    (job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     job.company?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterLocation === 'All' || job.location?.includes(filterLocation))
  );

  const getCategoryIcon = (cat) => {
    switch(cat) {
      case 'Commercial': return <Building2 className="size-4" />;
      case 'Joinery': return <Layout className="size-4" />;
      case 'Retail': return <PencilRuler className="size-4" />;
      default: return <HardHat className="size-4" />;
    }
  };

  const JobDetailContent = ({ job }) => (
    <div className="bg-white md:rounded-3xl shadow-xl md:border border-slate-200 overflow-hidden min-h-screen md:min-h-0">
      <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white">
        <div className="flex justify-between items-start mb-6">
          <div className="size-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-3">
            <Building2 className="text-indigo-600 size-full" />
          </div>
          <div className="flex gap-2">
            {showMobileDetail && (
              <button onClick={() => setShowMobileDetail(false)} className="md:hidden p-3 bg-slate-100 text-slate-600 rounded-xl">
                <X className="size-5" />
              </button>
            )}
            <button onClick={() => toggleSave(job.id)} className={`p-3 rounded-xl transition-colors ${savedJobs.has(job.id) ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
              <Bookmark className="size-5" fill={savedJobs.has(job.id) ? "currentColor" : "none"} />
            </button>
            <button className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors">
              <Share2 className="size-5" />
            </button>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">{job.title}</h2>
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-slate-500 font-medium text-sm">
          <span className="flex items-center gap-2"><Building2 className="size-4 text-indigo-500" /> {job.company}</span>
          <span className="flex items-center gap-2"><MapPin className="size-4 text-indigo-500" /> {job.location}</span>
          <span className="flex items-center gap-2"><Clock className="size-4 text-indigo-500" /> {job.type}</span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Monthly Salary</p>
            <p className="text-lg font-bold text-slate-800">{job.salary}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sector</p>
            <p className="text-lg font-bold text-slate-800">{job.category} Fit-out</p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
            Project Overview
          </h4>
          <p className="text-slate-600 leading-relaxed text-sm">{job.description}</p>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-full" />
            Requirements
          </h4>
          <ul className="space-y-3">
            {(job.requirements || []).map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle className="size-4 text-green-500 mt-0.5 shrink-0" /> {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => toggleApply(job.id)}
            className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              appliedJobs.has(job.id) ? 'bg-green-500 text-white shadow-green-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
          >
            {appliedJobs.has(job.id) ? 'Application Sent' : 'Express Interest'}
          </button>
          <a href={job.link} target="_blank" rel="noreferrer" className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            View Source <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
                <Hammer className="text-white size-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 italic">FITOUT<span className="text-indigo-600">PRO</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 hidden sm:block">SOLO FOUNDER MODE</span>
            <div className="size-10 bg-slate-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} alt="avatar" />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 py-6 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input 
              type="text" placeholder="Search fit-out roles..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none transition-all text-slate-700 font-medium"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:w-64 relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <select className="w-full pl-12 pr-10 py-4 bg-slate-50 rounded-2xl outline-none appearance-none font-medium text-slate-700" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="All">All Regions</option>
              <optgroup label="Middle East">
                <option value="Dubai">Dubai</option>
                <option value="Abu Dhabi">Abu Dhabi</option>
                <option value="Riyadh">Riyadh</option>
              </optgroup>
              <optgroup label="India">
                <option value="Noida">Noida</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Mumbai">Mumbai</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1400px] mx-auto w-full flex relative overflow-hidden">
        <section className={`w-full md:w-[450px] border-r border-slate-200 overflow-y-auto bg-white ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
          <div className="p-6">
            <h2 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-6">LIVE OPPORTUNITIES ({filteredJobs.length})</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(n => <div key={n} className="h-32 bg-slate-50 rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="space-y-3">
                {filteredJobs.map(job => (
                  <div key={job.id} onClick={() => handleJobSelect(job)} className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${selectedJob?.id === job.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-300 bg-white shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${selectedJob?.id === job.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {job.category}
                      </div>
                    </div>
                    <h3 className={`font-bold mb-1 line-clamp-1 ${selectedJob?.id === job.id ? 'text-indigo-900' : 'text-slate-800'}`}>{job.title}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-3">{job.company}</p>
                    <div className="text-xs text-slate-400 font-semibold">{job.location}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">No jobs found in this region.</div>
            )}
          </div>
        </section>

        <section className={`flex-1 bg-slate-50 overflow-y-auto ${showMobileDetail ? 'fixed inset-0 z-40 md:relative md:z-0 md:flex' : 'hidden md:flex'}`}>
          {selectedJob ? (
            <div className="p-0 md:p-10 w-full max-w-3xl mx-auto">
              <JobDetailContent job={selectedJob} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full text-slate-400">
              <Layout className="size-16 mb-4 opacity-20" />
              <p>Select a job to view details</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
