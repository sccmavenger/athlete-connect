export const MAX_COLLEGE_INTERESTS = 10;

export type CollegeOption = {
  name: string;
  state: string;
  division: string;
};

/**
 * Curated program list with a Midwest emphasis (Summit Hoops' footprint),
 * plus national programs athletes commonly target. Athletes can still type
 * any school that isn't listed here.
 */
export const COLLEGES: CollegeOption[] = [
  // Kansas
  { name: "University of Kansas", state: "KS", division: "D1" },
  { name: "Kansas State University", state: "KS", division: "D1" },
  { name: "Wichita State University", state: "KS", division: "D1" },
  { name: "Emporia State University", state: "KS", division: "D2" },
  { name: "Fort Hays State University", state: "KS", division: "D2" },
  { name: "Washburn University", state: "KS", division: "D2" },
  { name: "Pittsburg State University", state: "KS", division: "D2" },
  { name: "Newman University", state: "KS", division: "D2" },
  { name: "Friends University", state: "KS", division: "NAIA" },
  { name: "Ottawa University", state: "KS", division: "NAIA" },
  { name: "Bethel College", state: "KS", division: "NAIA" },
  { name: "Hutchinson Community College", state: "KS", division: "JUCO" },
  { name: "Barton Community College", state: "KS", division: "JUCO" },
  { name: "Butler Community College", state: "KS", division: "JUCO" },
  { name: "Garden City Community College", state: "KS", division: "JUCO" },

  // Missouri
  { name: "University of Missouri", state: "MO", division: "D1" },
  { name: "Saint Louis University", state: "MO", division: "D1" },
  { name: "Missouri State University", state: "MO", division: "D1" },
  { name: "University of Missouri–Kansas City", state: "MO", division: "D1" },
  { name: "Southeast Missouri State University", state: "MO", division: "D1" },
  { name: "Northwest Missouri State University", state: "MO", division: "D2" },
  { name: "Missouri Western State University", state: "MO", division: "D2" },
  { name: "Rockhurst University", state: "MO", division: "D2" },
  { name: "Drury University", state: "MO", division: "D2" },
  { name: "William Jewell College", state: "MO", division: "D2" },
  { name: "Central Methodist University", state: "MO", division: "NAIA" },
  { name: "Park University", state: "MO", division: "NAIA" },

  // Oklahoma
  { name: "University of Oklahoma", state: "OK", division: "D1" },
  { name: "Oklahoma State University", state: "OK", division: "D1" },
  { name: "University of Tulsa", state: "OK", division: "D1" },
  { name: "Oral Roberts University", state: "OK", division: "D1" },
  { name: "Oklahoma Christian University", state: "OK", division: "D2" },
  { name: "Southern Nazarene University", state: "OK", division: "D2" },
  { name: "Northeastern State University", state: "OK", division: "D2" },

  // Nebraska / Iowa / Dakotas
  { name: "University of Nebraska", state: "NE", division: "D1" },
  { name: "Creighton University", state: "NE", division: "D1" },
  { name: "University of Nebraska Omaha", state: "NE", division: "D1" },
  { name: "Wayne State College", state: "NE", division: "D2" },
  { name: "University of Iowa", state: "IA", division: "D1" },
  { name: "Iowa State University", state: "IA", division: "D1" },
  { name: "Drake University", state: "IA", division: "D1" },
  { name: "University of Northern Iowa", state: "IA", division: "D1" },
  { name: "South Dakota State University", state: "SD", division: "D1" },
  { name: "University of South Dakota", state: "SD", division: "D1" },
  { name: "North Dakota State University", state: "ND", division: "D1" },
  { name: "University of North Dakota", state: "ND", division: "D1" },

  // Illinois / Indiana / Michigan / Ohio / Wisconsin / Minnesota
  { name: "University of Illinois", state: "IL", division: "D1" },
  { name: "Northwestern University", state: "IL", division: "D1" },
  { name: "DePaul University", state: "IL", division: "D1" },
  { name: "Bradley University", state: "IL", division: "D1" },
  { name: "Loyola University Chicago", state: "IL", division: "D1" },
  { name: "Southern Illinois University", state: "IL", division: "D1" },
  { name: "Illinois State University", state: "IL", division: "D1" },
  { name: "Indiana University", state: "IN", division: "D1" },
  { name: "Purdue University", state: "IN", division: "D1" },
  { name: "Butler University", state: "IN", division: "D1" },
  { name: "University of Notre Dame", state: "IN", division: "D1" },
  { name: "Valparaiso University", state: "IN", division: "D1" },
  { name: "University of Michigan", state: "MI", division: "D1" },
  { name: "Michigan State University", state: "MI", division: "D1" },
  { name: "Oakland University", state: "MI", division: "D1" },
  { name: "Ohio State University", state: "OH", division: "D1" },
  { name: "University of Dayton", state: "OH", division: "D1" },
  { name: "University of Cincinnati", state: "OH", division: "D1" },
  { name: "Xavier University", state: "OH", division: "D1" },
  { name: "University of Wisconsin", state: "WI", division: "D1" },
  { name: "Marquette University", state: "WI", division: "D1" },
  { name: "University of Wisconsin–Green Bay", state: "WI", division: "D1" },
  { name: "University of Minnesota", state: "MN", division: "D1" },
  { name: "Minnesota State University, Mankato", state: "MN", division: "D2" },

  // Common national targets
  { name: "Duke University", state: "NC", division: "D1" },
  { name: "University of North Carolina", state: "NC", division: "D1" },
  { name: "University of Kentucky", state: "KY", division: "D1" },
  { name: "University of Louisville", state: "KY", division: "D1" },
  { name: "Gonzaga University", state: "WA", division: "D1" },
  { name: "University of Arizona", state: "AZ", division: "D1" },
  { name: "University of Texas", state: "TX", division: "D1" },
  { name: "Baylor University", state: "TX", division: "D1" },
  { name: "Texas Tech University", state: "TX", division: "D1" },
  { name: "University of Houston", state: "TX", division: "D1" },
  { name: "University of Arkansas", state: "AR", division: "D1" },
  { name: "University of Colorado", state: "CO", division: "D1" },
  { name: "University of Memphis", state: "TN", division: "D1" },
  { name: "UCLA", state: "CA", division: "D1" },
  { name: "University of Southern California", state: "CA", division: "D1" },
];

export function searchColleges(query: string, limit = 8): CollegeOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return COLLEGES.slice(0, limit);
  const starts: CollegeOption[] = [];
  const contains: CollegeOption[] = [];
  for (const c of COLLEGES) {
    const n = c.name.toLowerCase();
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q) || c.state.toLowerCase() === q) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}
