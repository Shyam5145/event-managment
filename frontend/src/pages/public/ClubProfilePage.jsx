import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Globe, 
  Github, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Calendar, 
  Users, 
  Award, 
  Sparkles, 
  Edit3, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventContext';
import { useToast } from '../../context/ToastContext';
import { validateOrganizerProfile } from '../../services/userService.js';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card, { CardContent } from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

const CLUB_STORAGE_KEY = 'campuspulse_club_profile';

const INITIAL_CLUB_DATA = {
  id: 'tech-club',
  name: 'Tech Club & Developer Syndicate',
  category: 'Technical',
  lead: 'Aarav Patel',
  email: 'techclub@campus.edu',
  founded: '2021',
  membersCount: 420,
  logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&q=80',
  banner: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80',
  description: 'The premier student-led developer hub at University of Technology. We foster high-impact engineering culture through open-source hackathons, AI workshops, and engineering mentorship.',
  about: 'Founded with the mission to bridge the gap between academic theory and real-world software architecture. Our alumni work at top companies including Google, Microsoft, and high-growth YC startups. Join us every Friday for tech teardowns, hack nights, and peer code reviews.',
  website: 'https://techclub-campus.org',
  github: 'https://github.com/techclub-campus',
  linkedin: 'https://linkedin.com/company/techclub-campus',
  twitter: 'https://twitter.com/techclub_campus',
  instagram: 'https://instagram.com/techclub_campus',
  tags: ['Open Source', 'Hackathons', 'Full-Stack', 'AI/ML', 'Cloud Systems'],
};

export const ClubProfilePage = () => {
  const { id } = useParams();
  const { user, role, updateOrganizerProfile } = useAuth();
  const { events } = useEvents();
  const toast = useToast();

  const [club, setClub] = useState(() => {
    try {
      const saved = localStorage.getItem(CLUB_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CLUB_DATA;
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState(club);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync organizer user profile if current logged-in user is an organizer
  useEffect(() => {
    if (role === 'organizer' && user) {
      setClub((prev) => ({
        ...prev,
        name: user.clubName || user.name || prev.name,
        lead: user.organizerName || user.name || prev.lead,
        email: user.email || prev.email,
        description: user.description || user.bio || prev.description,
        category: user.category || user.department?.replace(' Council', '') || prev.category,
        logo: user.photoURL || user.avatar || prev.logo,
      }));
    }
  }, [user, role]);

  useEffect(() => {
    try {
      localStorage.setItem(CLUB_STORAGE_KEY, JSON.stringify(club));
    } catch (e) {
      console.error(e);
    }
  }, [club]);

  // Filter events organized by this club
  const clubEvents = events.filter((e) => 
    e.organizer.toLowerCase().includes('tech') || 
    e.organizer.toLowerCase().includes('acm') ||
    e.category === 'Technical'
  );

  const upcomingEvents = clubEvents.slice(0, 3);
  const pastEvents = [
    {
      id: 'past-1',
      title: 'DevOps & Kubernetes Cloud Workshop',
      date: 'October 12, 2026',
      attendees: 164,
      category: 'Technical',
      venue: 'Lab 4, Computing Complex',
    },
    {
      id: 'past-2',
      title: 'Intro to LLMs & Prompt Engineering',
      date: 'September 28, 2026',
      attendees: 210,
      category: 'Technical',
      venue: 'Auditorium 2',
    },
  ];

  const handleOpenEdit = () => {
    setFormData(club);
    setErrors({});
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    const { valid, errors: valErrors } = validateOrganizerProfile({
      name: formData.name,
      category: formData.category,
      description: formData.description,
    });

    if (!valid) {
      setErrors(valErrors);
      toast.error(Object.values(valErrors)[0] || 'Please complete required profile fields');
      return;
    }

    setSaving(true);
    try {
      if (updateOrganizerProfile && user?.uid) {
        await updateOrganizerProfile({
          name: formData.name,
          clubName: formData.name,
          description: formData.description,
          category: formData.category,
          website: formData.website,
          github: formData.github,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          photoURL: formData.logo,
        });
      }

      setClub(formData);
      setEditModalOpen(false);
      toast.success('Club profile updated and synced to Firestore!', 'Organizer Profile Saved');
    } catch (err) {
      toast.error(err.message || 'Failed to update club profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hero Banner Header */}
        <div className="relative w-full h-56 sm:h-72 bg-slate-900 overflow-hidden">
          <img
            src={club.banner}
            alt={club.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
        </div>

        {/* Club Details Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10">
          <div className="bg-surface rounded-2xl border border-border shadow-elevated p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
              
              {/* Logo & Basic Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                <img
                  src={club.logo}
                  alt={club.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-surface shadow-md bg-white shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm">
                      {club.category}
                    </Badge>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Officially Chartered
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                    {club.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      {club.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-secondary" />
                      {club.membersCount}+ active members
                    </span>
                    <span>•</span>
                    <span>Est. {club.founded}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenEdit}
                  icon={Edit3}
                  className="text-xs font-semibold"
                >
                  Edit Club Profile
                </Button>
                <Link to="/organizer/events/create">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    + Host Event
                  </Button>
                </Link>
              </div>
            </div>

            {/* Club Description & Social Links Bar */}
            <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left 2 Cols: About & Events */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* About section */}
                <div>
                  <h3 className="text-base font-bold text-main mb-2">About the Organization</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {club.description}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal mt-3">
                    {club.about}
                  </p>

                  {/* Club Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {club.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events Hosted */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-main flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Upcoming Events ({upcomingEvents.length})
                    </h3>
                    <Link to="/events" className="text-xs font-semibold text-primary hover:underline">
                      View all campus events →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {upcomingEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/40 hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={evt.image}
                            alt={evt.title}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-primary uppercase">
                              {evt.category}
                            </span>
                            <h4 className="text-sm font-bold text-main hover:text-primary">
                              <Link to={`/events/${evt.id}`}>{evt.title}</Link>
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-secondary mt-0.5">
                              <span>{evt.date}</span>
                              <span>•</span>
                              <span>{evt.venue}</span>
                            </div>
                          </div>
                        </div>

                        <Link to={`/events/${evt.id}`}>
                          <Button variant="outline" size="sm" className="text-xs shrink-0 font-medium">
                            Register / Details
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Past Events Archive */}
                <div>
                  <h3 className="text-base font-bold text-main mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-secondary" />
                    Past Events Archive
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pastEvents.map((pe) => (
                      <div key={pe.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                        <span className="text-[10px] font-semibold text-secondary uppercase">{pe.date}</span>
                        <h5 className="text-xs font-bold text-main mt-0.5">{pe.title}</h5>
                        <div className="mt-2 text-[11px] text-secondary flex items-center justify-between">
                          <span>{pe.venue}</span>
                          <span className="font-semibold text-primary">{pe.attendees} attended</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1 Col: Sidebar Info & Socials */}
              <div className="space-y-6">
                
                {/* Contact & Social Links */}
                <div className="p-5 rounded-xl border border-border bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Official Connect & Links
                  </h4>

                  <div className="space-y-2.5">
                    {club.website && (
                      <a
                        href={club.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-primary transition-colors group"
                      >
                        <Globe className="w-4 h-4 text-secondary group-hover:text-primary" />
                        <span className="truncate">{club.website}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                      </a>
                    )}

                    {club.github && (
                      <a
                        href={club.github}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-primary transition-colors group"
                      >
                        <Github className="w-4 h-4 text-secondary group-hover:text-primary" />
                        <span className="truncate">GitHub Repository</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                      </a>
                    )}

                    {club.linkedin && (
                      <a
                        href={club.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-primary transition-colors group"
                      >
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        <span className="truncate">LinkedIn Page</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                      </a>
                    )}

                    {club.twitter && (
                      <a
                        href={club.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-primary transition-colors group"
                      >
                        <Twitter className="w-4 h-4 text-slate-800" />
                        <span className="truncate">Twitter / X</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                      </a>
                    )}

                    {club.instagram && (
                      <a
                        href={club.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-primary transition-colors group"
                      >
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <span className="truncate">Instagram Hub</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Club Leadership Card */}
                <div className="p-5 rounded-xl border border-border bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Executive Leadership
                  </h4>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                      alt={club.lead}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-bold text-main">{club.lead}</p>
                      <p className="text-[11px] text-secondary">President & Head Organizer</p>
                    </div>
                  </div>
                </div>

                {/* Verification badge */}
                <div className="p-4 rounded-xl bg-primary-light/40 border border-primary/20 text-xs space-y-1">
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Campus Verified
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Event certifications issued by this club are verified on the university registrar chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Club Profile"
        description="Update your club's public branding, bio, and social links."
        size="md"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit} loading={saving}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Club Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            error={errors.name}
          />

          <Input
            label="Contact Email"
            type="email"
            value={formData.email}
            disabled
            required
          />

          <Input
            label="Club Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
            error={errors.category}
          />

          <div>
            <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Description / Mission
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-surface border rounded-xl text-main focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.description ? 'border-red-500' : 'border-border focus:border-primary'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
            <Input
              label="GitHub URL"
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="LinkedIn URL"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            />
            <Input
              label="Twitter / X"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
};

export default ClubProfilePage;

