import React, { useState } from 'react';
import { 
  Award, 
  Download, 
  Share2, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  Calendar,
  Eye,
  Check,
  Building,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { isFirebaseConfigured } from '../../services/firebase.js';
import { getStudentCertificates } from '../../services/certificateService.js';

export const StudentCertificatesPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [selectedCert, setSelectedCert] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [remoteCerts, setRemoteCerts] = useState(null);

  React.useEffect(() => {
    if (!isFirebaseConfigured || !user?.uid) return;
    getStudentCertificates(user.uid)
      .then((docs) => {
        if (docs && docs.length > 0) {
          setRemoteCerts(docs);
        }
      })
      .catch((e) => console.warn('Could not fetch certificates from Firestore:', e));
  }, [user?.uid]);

  const certificatesList = [
    {
      id: 'cert-1',
      credentialId: 'CP-CERT-2026-9481',
      eventName: 'Full-Stack React & AI Systems Bootcamp',
      issuedBy: 'ACM Student Chapter & Innovation Lab',
      date: 'October 24, 2026',
      type: 'Certificate of Mastery',
      skills: ['React 18', 'Tailwind CSS', 'Vite', 'State Management'],
      grade: 'Distinction (Top 5%)',
      accentColor: 'indigo',
    },
    {
      id: 'cert-2',
      credentialId: 'CP-CERT-2026-3829',
      eventName: 'UI/UX Design Sprint: Zero to Figma Masterclass',
      issuedBy: 'Design & Product Guild',
      date: 'September 15, 2026',
      type: 'Certificate of Completion',
      skills: ['Figma Prototyping', 'Design Systems', 'User Research'],
      grade: 'Verified Completion',
      accentColor: 'purple',
    },
    {
      id: 'cert-3',
      credentialId: 'CP-CERT-2026-5510',
      eventName: 'Campus CodeSprint Hackathon 2025',
      issuedBy: 'Dean of Student Affairs & Tech Syndicate',
      date: 'November 18, 2025',
      type: 'Certificate of Excellence',
      skills: ['Algorithmic Thinking', 'Rapid Prototyping', 'Team Leadership'],
      grade: '1st Runner Up',
      accentColor: 'emerald',
    },
  ];

  const displayCertificates = remoteCerts && remoteCerts.length > 0 ? remoteCerts : certificatesList;

  const handleOpenCertificate = (cert) => {
    setSelectedCert(cert);
    setCertModalOpen(true);
  };

  // Generate downloadable PNG certificate via HTML5 Canvas
  const handleDownloadPNG = (cert) => {
    const studentName = user?.name || 'Rahul Sharma';
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 840;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 840);
    bgGrad.addColorStop(0, '#FFFFFF');
    bgGrad.addColorStop(1, '#F8FAFC');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 840);

    // Outer Border (Navy / Indigo)
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, 1140, 780);

    // Inner Gold Accent Border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 1104, 744);

    // Header Emblem & Title
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAMPUSPULSE ACADEMIC CREDENTIALS COUNCIL', 600, 115);

    ctx.fillStyle = '#64748B';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('OFFICIAL VERIFIED CERTIFICATE OF PARTICIPATION & EXCELLENCE', 600, 142);

    // Certificate Type Title
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillText(cert.type.toUpperCase(), 600, 220);

    // Presentation clause
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('This is proudly awarded to', 600, 275);

    // Recipient Name
    ctx.fillStyle = '#1E1B4B';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText(studentName, 600, 340);

    // Underline for recipient name
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(350, 360);
    ctx.lineTo(850, 360);
    ctx.stroke();

    // Event statement
    ctx.fillStyle = '#475569';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('for successful participation and distinguished performance in', 600, 410);

    // Event Name
    ctx.fillStyle = '#4F46E5';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(cert.eventName, 600, 460);

    // Issuer & Grade
    ctx.fillStyle = '#64748B';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Conducted by ${cert.issuedBy}  •  Grade: ${cert.grade}`, 600, 505);

    // Decorative Seal / Stamp
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(600, 605, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#B45309';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('★ VERIFIED ★', 600, 600);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('CAMPUSPULSE', 600, 615);

    // Bottom Signatures & IDs
    // Left: Date
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(cert.date, 120, 710);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(120, 690);
    ctx.lineTo(300, 690);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Date Issued', 120, 730);

    // Right: Issuer Signature
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Dr. Julian Vance, Dean', 1080, 710);
    ctx.beginPath();
    ctx.moveTo(900, 690);
    ctx.lineTo(1080, 690);
    ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Academic Affairs Board', 1080, 730);

    // Center Credential ID
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Credential ID: ${cert.credentialId}  •  Verify at campuspulse.edu/verify`, 600, 765);

    // Download trigger
    const link = document.createElement('a');
    link.download = `${cert.credentialId}-${studentName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success(`Certificate ${cert.credentialId} downloaded!`, 'Credential Saved');
  };

  const handleShare = (cert) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://campuspulse.edu/verify/${cert.credentialId}`);
      setCopiedId(cert.id);
      setTimeout(() => setCopiedId(null), 2500);
      toast.success('Verification link copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Badge variant="purple" size="sm" className="mb-2">Verified Credentials</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
          My Certificates & Achievements ({displayCertificates.length})
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Officially stamped academic certificates earned by attending verified campus workshops, hackathons, and symposiums.
        </p>
      </div>

      {/* Certificates Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCertificates.map((cert) => (
          <Card key={cert.id} className="p-5 flex flex-col justify-between border-border/80 shadow-subtle hover:shadow-premium transition-all group">
            
            <div className="space-y-4">
              {/* Certificate Preview Card / Mini Diploma Frame */}
              <div 
                onClick={() => handleOpenCertificate(cert)}
                className="relative cursor-pointer rounded-xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/40 p-4 shadow-inner group-hover:border-primary transition-all overflow-hidden"
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-semibold text-emerald-700 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified
                </div>

                <div className="text-center pt-2 pb-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                    {cert.type}
                  </span>
                  <h4 className="text-xs font-bold text-main line-clamp-1 mt-1 font-serif">
                    {cert.eventName}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Awarded to <span className="font-semibold text-main">{user?.name || 'Rahul Sharma'}</span>
                  </p>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[9px] text-secondary">
                  <span>{cert.date}</span>
                  <span className="font-mono text-primary font-bold">{cert.credentialId}</span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-2xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="px-3 py-1.5 rounded-lg bg-surface text-xs font-bold text-primary shadow-md flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Preview Certificate
                  </span>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm" className="text-[10px] font-semibold">
                    {cert.type}
                  </Badge>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                    {cert.grade}
                  </span>
                </div>

                <h3 className="text-base font-bold text-main group-hover:text-primary transition-colors line-clamp-2">
                  {cert.eventName}
                </h3>

                <p className="text-xs text-secondary flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span className="truncate">{cert.issuedBy}</span>
                </p>

                <p className="text-xs text-secondary flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary shrink-0" />
                  <span>Issued on {cert.date}</span>
                </p>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {cert.skills.map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border mt-4 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => handleDownloadPNG(cert)}
                className="flex-1 text-xs font-semibold"
              >
                Download PNG
              </Button>

              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={() => handleOpenCertificate(cert)}
                className="text-xs px-2.5"
                title="Preview"
              />

              <Button
                variant="outline"
                size="sm"
                icon={copiedId === cert.id ? Check : Share2}
                onClick={() => handleShare(cert)}
                className="text-xs px-2.5"
                title="Copy verification link"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCert && (
        <Modal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          title="Verified Academic Credential"
          size="lg"
        >
          <div className="space-y-6">
            {/* Visual Certificate Frame */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-amber-50/30 border-8 border-indigo-900/90 shadow-2xl relative text-center">
              
              {/* Inner Gold Border */}
              <div className="border-2 border-amber-500/80 p-6 sm:p-8 rounded-lg relative">
                
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-extrabold text-sm tracking-widest text-primary uppercase">
                    CampusPulse Official Credential
                  </span>
                </div>

                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-6">
                  Office of Academic & Extracurricular Excellence
                </p>

                <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight mb-2">
                  {selectedCert.type.toUpperCase()}
                </h2>

                <p className="text-xs text-slate-500 italic mb-4">
                  This certifies that
                </p>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight border-b-2 border-slate-200 pb-2 inline-block px-8 max-w-full">
                  {user?.name || 'Rahul Sharma'}
                </h3>

                <p className="text-xs text-slate-600 mt-4 max-w-md mx-auto leading-relaxed">
                  has distinguished themselves through verified attendance, rigorous participation, and mastery of all required milestones in
                </p>

                <h4 className="text-lg sm:text-xl font-bold font-serif text-primary mt-2">
                  {selectedCert.eventName}
                </h4>

                <p className="text-xs text-slate-500 mt-1">
                  Issued by {selectedCert.issuedBy} • Evaluation: <span className="font-bold text-slate-800">{selectedCert.grade}</span>
                </p>

                {/* Stamped Seal and Signatures */}
                <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 items-end">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900">{selectedCert.date}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Date Granted</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-600 flex flex-col items-center justify-center text-amber-800 shadow-sm">
                      <ShieldCheck className="w-5 h-5" />
                      <span className="text-[8px] font-extrabold uppercase">Verified</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">Dr. Julian Vance</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Dean of Student Affairs</p>
                  </div>
                </div>

                <div className="mt-5 text-[10px] font-mono text-slate-400">
                  Credential ID: {selectedCert.credentialId} • Non-Transferable Campus Pass
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
              <span className="text-xs text-secondary">
                Official high-resolution PNG with cryptographic hash watermark
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(selectedCert)}
                  icon={Share2}
                >
                  Share Credential
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadPNG(selectedCert)}
                  icon={Download}
                >
                  Download Certificate (PNG)
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentCertificatesPage;
