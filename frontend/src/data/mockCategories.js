export const EVENT_CATEGORIES = [
  { id: 'all', name: 'All Categories', color: 'primary', icon: 'Sparkles', count: 12 },
  { id: 'technical', name: 'Technical', color: 'primary', badgeVariant: 'primary', icon: 'Code2', count: 4, desc: 'Hackathons, coding challenges, robotics & AI' },
  { id: 'cultural', name: 'Cultural', color: 'purple', badgeVariant: 'purple', icon: 'Palette', count: 2, desc: 'Festivals, dance, theater, and fine arts' },
  { id: 'sports', name: 'Sports', color: 'warning', badgeVariant: 'warning', icon: 'Trophy', count: 2, desc: 'Tournaments, leagues, and athletic meets' },
  { id: 'workshops', name: 'Workshops', color: 'blue', badgeVariant: 'blue', icon: 'GraduationCap', count: 2, desc: 'Skill-building seminars and hands-on bootcamps' },
  { id: 'music', name: 'Music', color: 'purple', badgeVariant: 'purple', icon: 'Music', count: 1, desc: 'Concerts, band battles, acoustic nights' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', color: 'teal', badgeVariant: 'teal', icon: 'Rocket', count: 1, desc: 'Startup pitches, founder talks & VC mixers' },
  { id: 'photography', name: 'Photography', color: 'blue', badgeVariant: 'blue', icon: 'Camera', count: 1, desc: 'Photo walks, gallery showcases, editing labs' },
  { id: 'gaming', name: 'Gaming', color: 'warning', badgeVariant: 'warning', icon: 'Gamepad2', count: 1, desc: 'Esports showdowns, LAN parties & VR arenas' },
];

export const CATEGORIES = EVENT_CATEGORIES.filter((c) => c.id !== 'all');
export default EVENT_CATEGORIES;

