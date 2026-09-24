export type JobCard = {
  id: number;
  imageUrl?: string | null;
  title: string;
  company: string;
  country: string;
  city: string;
  category: string;
  type: string;
  salary: string;
  vacancies: number;
  posted: string;
};

export const fallbackJobs: JobCard[] = [
  {
    id: 1,
    title: "Hotel Housekeeper",
    company: "Aegean Hospitality Group",
    country: "Greece",
    city: "Athens",
    category: "Hospitality",
    type: "Full-time",
    salary: "€900–€1,150 / month",
    vacancies: 24,
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Construction Worker",
    company: "NordBuild SRL",
    country: "Romania",
    city: "Bucharest",
    category: "Construction",
    type: "Full-time",
    salary: "€850–€1,100 / month",
    vacancies: 40,
    posted: "3 days ago",
  },
  {
    id: 3,
    title: "Industrial Electrician",
    company: "Gulf Technical Services",
    country: "UAE",
    city: "Dubai",
    category: "Engineering",
    type: "Full-time",
    salary: "AED 2,800–3,500 / month",
    vacancies: 12,
    posted: "5 days ago",
  },
  {
    id: 4,
    title: "Restaurant Server",
    company: "Mediterranean Dining Co.",
    country: "Cyprus",
    city: "Limassol",
    category: "Hospitality",
    type: "Full-time",
    salary: "€950–€1,200 / month",
    vacancies: 18,
    posted: "1 week ago",
  },
];
