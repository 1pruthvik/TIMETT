export interface MasterSubject {
  code: string;
  name: string;
  department: string;
  category: 'theory' | 'tutorial' | 'practical';
  weekly_hours: number;
}

export interface BranchSemesterSubjects {
  theory: MasterSubject[];
  tutorial?: MasterSubject[];
  practical: MasterSubject[];
}

export const VTU_HIGHER_SEMESTER_TEMPLATES: Record<
  number,
  Record<string, BranchSemesterSubjects>
> = {
  "3": {
    "CSE": {
      "theory": [
        {
          "code": "1BMATCS301",
          "name": "Probability, Distributions and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS303",
          "name": "Digital Design and Computer Organization",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS304",
          "name": "Operating Systems",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS305",
          "name": "Data Structures and Applications",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL306",
          "name": "Data Structures Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL307A",
          "name": "Project Management (with Git)",
          "department": "Humanities Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BMATCS301",
          "name": "Probability, Distributions and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS303",
          "name": "Digital Design and Computer Organization",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS304",
          "name": "Operating Systems",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS305",
          "name": "Data Structures and Applications",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL306",
          "name": "Data Structures Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL307x",
          "name": "Ability Enhancement Course",
          "department": "AI/ML Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BMATCS301",
          "name": "Probability, Distributions and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS303",
          "name": "Digital Design and Computer Organization",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS304",
          "name": "Operating Systems",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS305",
          "name": "Data Structures and Applications",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL306",
          "name": "Data Structures Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL307x",
          "name": "Ability Enhancement Course",
          "department": "Data Science Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ISE": {
      "theory": [
        {
          "code": "1BMATCS301",
          "name": "Probability, Distributions and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS303",
          "name": "Digital Design and Computer Organization",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS304",
          "name": "Operating Systems",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS305",
          "name": "Data Structures and Applications",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL306",
          "name": "Data Structures Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL307A",
          "name": "Project Management (with Git)",
          "department": "Humanities Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BMATCS301",
          "name": "Probability, Distributions and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS303",
          "name": "Digital Design and Computer Organization",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS304",
          "name": "Operating Systems",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS305",
          "name": "Data Structures and Applications",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCS302",
          "name": "Object Oriented Programming with Java Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL306",
          "name": "Data Structures Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL307x",
          "name": "Ability Enhancement Course",
          "department": "AI/DS Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ECE": {
      "theory": [
        {
          "code": "1BMATEC301",
          "name": "Transform Techniques and Optimization Theory",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BEC302",
          "name": "Digital System Design Using Verilog",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEC303",
          "name": "Network Analysis",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BEC304",
          "name": "Analog Electronics and Linear Integrated Circuits",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEC305",
          "name": "Python Programming",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BEC302",
          "name": "Digital System Design Using Verilog Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BECL306",
          "name": "Analog Electronics and Linear Integrated Circuits Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BECL307x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ME": {
      "theory": [
        {
          "code": "1BMATM301",
          "name": "Transforms and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BME302",
          "name": "Materials Science and Metallurgy",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME303",
          "name": "Basic Thermodynamics",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME304",
          "name": "Mechanics of Materials",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME305",
          "name": "Manufacturing Technology - I",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BME302",
          "name": "Materials Science and Metallurgy Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BMEL306",
          "name": "Computer Aided Machine Drawing Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 4
        },
        {
          "code": "1BMEL307x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CIV": {
      "theory": [
        {
          "code": "1BMATCV301",
          "name": "Probability and Statistics",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCV302",
          "name": "Fluid Mechanics and Hydraulic Machinery",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV303",
          "name": "Solid Mechanics",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCV304",
          "name": "Building Materials and Construction Methods",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV305",
          "name": "Engineering Geology for Infrastructure Projects",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCV302",
          "name": "Fluid Mechanics and Hydraulic Machinery Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCVL306",
          "name": "Building CAD and 3D Modelling Lab",
          "department": "Civil Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCVL307x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "Civil Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CH": {
      "theory": [
        {
          "code": "1BMATCH301",
          "name": "Applied Differential Calculus in Chemical Engineering",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCH302",
          "name": "Mechanical Operations",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH303",
          "name": "Momentum Transfer",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCH304",
          "name": "Process Principles and Calculations",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH305",
          "name": "Materials Chemistry and its Applications",
          "department": "Chemistry Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BCH302",
          "name": "Mechanical Operations Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCHL306",
          "name": "Momentum Transfer Lab (Professional Core Course Lab)",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCHL307x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "BME": {
      "theory": [
        {
          "code": "1BBM301",
          "name": "Transform Techniques and Fourier Series",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BBM302",
          "name": "Digital Design and HDL",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BBM303",
          "name": "Analog Electronic Circuits",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BBM304",
          "name": "Human Anatomy and Physiology",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BBM305",
          "name": "Instrumentation, Measurements and Biomedical Transducers",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BMATDIP310",
          "name": "Mathematics course for Lateral Entry Students",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "1BBM302",
          "name": "Digital Design and HDL Lab",
          "department": "Biomedical Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BBML306",
          "name": "Analog Electronic Circuits Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BBML307",
          "name": "Instrumentation, Measurements and Biomedical Transducers Lab",
          "department": "Biomedical Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "EEE": {
      "theory": [
        {
          "code": "1BMATEEE301",
          "name": "Mathematics for Electrical Engineers",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BEE302",
          "name": "Electric Circuit Analysis",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BEE303",
          "name": "Analog Electronic Circuits",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEE304",
          "name": "Electrical Machines-I",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEE305",
          "name": "Electromagnetic Field Theory",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BEEL306",
          "name": "Analog Electronics Lab",
          "department": "EEE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BEEL307",
          "name": "Electrical Machines Lab-I",
          "department": "EEE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    }
  },
  "4": {
    "CSE": {
      "theory": [
        {
          "code": "1BCS401",
          "name": "Discrete Mathematics and Graph Theory",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS402",
          "name": "Database Management Systems",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS403",
          "name": "Computer Networks",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS404",
          "name": "Design and Analysis of Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS407",
          "name": "Biology for Computer Engineers",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BCS402",
          "name": "Database Management Systems Lab",
          "department": "Humanities Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL405",
          "name": "Algorithms Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL406x",
          "name": "Ability Enhancement Course",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BAI401",
          "name": "Discrete Mathematics and Optimization Techniques",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI403",
          "name": "Database Management Systems",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI404",
          "name": "Machine Learning",
          "department": "AI/ML Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS407",
          "name": "Biology for Computer Engineers",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAIL405",
          "name": "Machine Learning Laboratory",
          "department": "AI/ML Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL406x",
          "name": "Ability Enhancement Course",
          "department": "AI/ML Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BAI401",
          "name": "Discrete Mathematics and Optimization Techniques",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI403",
          "name": "Database Management Systems",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI404",
          "name": "Machine Learning",
          "department": "Data Science Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS407",
          "name": "Biology for Computer Engineers",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAIL405",
          "name": "Machine Learning Laboratory",
          "department": "Data Science Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL406x",
          "name": "Ability Enhancement Course",
          "department": "Data Science Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ISE": {
      "theory": [
        {
          "code": "1BCS401",
          "name": "Discrete Mathematics and Graph Theory",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS402",
          "name": "Database Management Systems",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS403",
          "name": "Computer Networks",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS404",
          "name": "Design and Analysis of Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS407",
          "name": "Biology for Computer Engineers",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BCS402",
          "name": "Database Management Systems Lab",
          "department": "Humanities Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCSL405",
          "name": "Algorithms Laboratory",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL406x",
          "name": "Ability Enhancement Course",
          "department": "ISE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BAI401",
          "name": "Discrete Mathematics and Optimization Techniques",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI403",
          "name": "Database Management Systems",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BAI404",
          "name": "Machine Learning",
          "department": "AI/DS Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCS407",
          "name": "Biology for Computer Engineers",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BAI402",
          "name": "Design and Analysis of Algorithms Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAIL405",
          "name": "Machine Learning Laboratory",
          "department": "AI/DS Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL406x",
          "name": "Ability Enhancement Course",
          "department": "AI/DS Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ECE": {
      "theory": [
        {
          "code": "1BMATEC401",
          "name": "Mathematics for Machine Learning",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEC402",
          "name": "Applied Computer Organization and Microcontroller",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEC403",
          "name": "Control Systems",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BEC404",
          "name": "Signals and Systems",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEC407",
          "name": "Biology for Electrical and Electronics Engineers",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 2
        },
        {
          "code": "1BEC409",
          "name": "Introduction to Analog Communication Systems",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BEC402",
          "name": "Applied Computer Organization and Microcontroller Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BECL405",
          "name": "Signals and Analog Communications Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BECL406",
          "name": "Ability Enhancement Course Laboratory",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "EEE": {
      "theory": [
        {
          "code": "1BEE401",
          "name": "Electric Motors",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEE402",
          "name": "Microcontroller",
          "department": "ECE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEE403",
          "name": "Field Theory",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BEE404",
          "name": "Transmission and Distribution",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BEE407",
          "name": "Biology for Electrical Engineers",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 2
        },
        {
          "code": "1BEE409",
          "name": "Electric Power Generation and Economics",
          "department": "EEE Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BEE402",
          "name": "Microcontroller Lab",
          "department": "ECE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BEEL405",
          "name": "Electric Motors Lab",
          "department": "EEE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BEEL406",
          "name": "Ability Enhancement Course Laboratory",
          "department": "EEE Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ME": {
      "theory": [
        {
          "code": "1BMATM401",
          "name": "Complex Analysis and Probability Distributions",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME402",
          "name": "Manufacturing Technology - II",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME403",
          "name": "Applied Thermodynamics",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BME404",
          "name": "Fluid Mechanics",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BME407",
          "name": "Biology for Engineers",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 2
        },
        {
          "code": "1BME409",
          "name": "Kinematics of Machines",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BME402",
          "name": "Manufacturing Technology - II Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BMEL405",
          "name": "Mechanical Measurements and Metrology Lab",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BMEL406x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "ME Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CIV": {
      "theory": [
        {
          "code": "1BCV401",
          "name": "Surveying and Geospatial Techniques",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV402",
          "name": "Water Supply and Sanitary Engineering",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV403",
          "name": "Analysis of Structures",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BCV404",
          "name": "Building Information Modelling (BIM)",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV407",
          "name": "Biology for Civil Engineers",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 2
        },
        {
          "code": "1BCV409",
          "name": "Concrete Technology",
          "department": "Civil Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCV402",
          "name": "Water Supply and Sanitary Engineering Lab",
          "department": "Civil Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCVL405",
          "name": "Surveying and Geospatial Engineering Laboratory",
          "department": "Civil Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCVL406",
          "name": "Ability Enhancement Course Laboratory",
          "department": "Civil Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CH": {
      "theory": [
        {
          "code": "1BMATCH401",
          "name": "Probability and Statistics for Chemical Engineering",
          "department": "Maths Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH402",
          "name": "Heat Transfer",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH403",
          "name": "Chemical Engineering Thermodynamics",
          "department": "ME Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCH404",
          "name": "Industrial Pollution Control and Management",
          "department": "Humanities Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH405",
          "name": "Chemical Reaction Engineering-I",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BRM408",
          "name": "Program Specific Biology",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "1BCH402",
          "name": "Heat Transfer Lab",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCHL406",
          "name": "Instrument Analysis and Pollution control lab (PCC Lab)",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCHL407",
          "name": "Ability Enhancement Course Laboratory",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "BME": {
      "theory": [
        {
          "code": "1BBM401",
          "name": "Data Acquisition Circuits",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BBM402",
          "name": "Data Structures and Algorithms",
          "department": "CSE Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BBM403",
          "name": "Biomechanics",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 5
        },
        {
          "code": "1BBM404",
          "name": "Embedded Controllers",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BBM407",
          "name": "Biology for Engineers",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 2
        },
        {
          "code": "1Bxx409",
          "name": "Control Systems Engineering",
          "department": "Biomedical Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BBM402",
          "name": "Data Structures and Algorithms Lab",
          "department": "CSE Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BBML405",
          "name": "Data Acquisition Circuits Lab",
          "department": "Biomedical Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BBML406",
          "name": "Embedded Controllers Lab",
          "department": "Biomedical Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    }
  },
  "5": {
    "CSE": {
      "theory": [
        {
          "code": "1BCS501",
          "name": "Software Engineering and Project Management",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS502",
          "name": "Machine Learning",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS503",
          "name": "Theory of Computation",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCS504",
          "name": "Computer Vision",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX505x",
          "name": "Professional Elective Course-I",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCSL507",
          "name": "Web Technology Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCS502L",
          "name": "Machine Learning Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BCS501",
          "name": "Software Engineering and Project Management",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI502",
          "name": "Artificial Intelligence",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS503",
          "name": "Theory of Computation",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BAI504",
          "name": "Computer Networks",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX505x",
          "name": "Professional Elective Course-I",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BAIL507",
          "name": "Data Visualization Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAI502L",
          "name": "Artificial Intelligence Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BCS501",
          "name": "Software Engineering and Project Management",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BDS502",
          "name": "No SQL Databases",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS503",
          "name": "Theory of Computation",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BAI504",
          "name": "Computer Networks",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX505x",
          "name": "Professional Elective Course-I",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BAIL507",
          "name": "Data Visualization Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BDS502L",
          "name": "No SQL Databases Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ISE": {
      "theory": [
        {
          "code": "1BCS501",
          "name": "Software Engineering and Project Management",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS502",
          "name": "Machine Learning",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS503",
          "name": "Theory of Computation",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BIS504",
          "name": "Full Stack Development",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX505x",
          "name": "Professional Elective Course-I",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BISL507",
          "name": "Full Stack Development Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCS502L",
          "name": "Machine Learning Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BCS501",
          "name": "Software Engineering and Project Management",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI502",
          "name": "Artificial Intelligence",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS503",
          "name": "Theory of Computation",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BAI504",
          "name": "Computer Networks",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX505x",
          "name": "Professional Elective Course-I",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BAIL507",
          "name": "Data Visualization Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAI502L",
          "name": "Artificial Intelligence Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ECE": {
      "theory": [
        {
          "code": "BEC501",
          "name": "Technological Innovation and Management Entrepreneurship",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC502",
          "name": "Digital Signal Processing",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC503",
          "name": "Digital Communication",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEC515x",
          "name": "Professional Elective Course",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BECL504",
          "name": "Digital Communication Lab",
          "department": "ECE/ETE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEC502L",
          "name": "Digital Signal Processing Laboratory",
          "department": "ECE/ETE",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "EEE": {
      "theory": [
        {
          "code": "BEE501",
          "name": "Engineering Management and Entrepreneurship",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE502",
          "name": "Signals & DSP",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE503",
          "name": "Power Electronics",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEE515x",
          "name": "Professional Elective Course",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BEEL504",
          "name": "Power Electronics Lab",
          "department": "EEE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEE502L",
          "name": "Signals & DSP Laboratory",
          "department": "EEE",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ME": {
      "theory": [
        {
          "code": "BME501",
          "name": "Industrial Management & Entrepreneurship",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME502",
          "name": "Turbo machines",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME503",
          "name": "Theory of Machines",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BME515x",
          "name": "Professional Elective - I",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BME504L",
          "name": "CNC Programming and 3-D Printing lab",
          "department": "ME",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BME502L",
          "name": "Turbo machines Laboratory",
          "department": "ME",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CIV": {
      "theory": [
        {
          "code": "BCV501",
          "name": "Construction Management and Entrepreneurship",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV502",
          "name": "Geotechnical Engineering",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV503",
          "name": "Concrete Technology",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV515x",
          "name": "Professional Elective Course",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BCV504",
          "name": "Environmental Engineering Lab",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCV502L",
          "name": "Geotechnical Engineering Laboratory",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCV503L",
          "name": "Concrete Technology Laboratory",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CH": {
      "theory": [
        {
          "code": "BCH501",
          "name": "Industrial Process Management",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCH502",
          "name": "Chemical Reaction Engineering",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCH503",
          "name": "Mass Transfer Operations-I",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BCH515x",
          "name": "Professional Elective Course",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BCHL504",
          "name": "Mass Transfer Operations Lab-1",
          "department": "CHEMICAL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCH502L",
          "name": "Chemical Reaction Engineering Laboratory",
          "department": "CHEMICAL",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "BME": {
      "theory": [
        {
          "code": "BBM501",
          "name": "Technological Innovation Management & Entrepreneurship",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM502",
          "name": "Digital Signal Processing",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM503",
          "name": "Clinical Instrumentation",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BBM515x",
          "name": "Professional Elective Course",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BRMK557",
          "name": "Research Methodology and IPR",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BESK508",
          "name": "Environmental Studies",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 2
        }
      ],
      "practical": [
        {
          "code": "BBM504",
          "name": "Clinical Instrumentation Lab",
          "department": "BIOMEDICAL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BBM502L",
          "name": "Digital Signal Processing Laboratory",
          "department": "BIOMEDICAL",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    }
  },
  "6": {
    "CSE": {
      "theory": [
        {
          "code": "1BCS601",
          "name": "Advanced Java Programming",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS602",
          "name": "Cryptography and Network Security",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS603",
          "name": "High Performance Computing",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS604",
          "name": "Internet of Things",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX605x",
          "name": "Professional Elective Courses-II",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCSL606",
          "name": "IoT laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL607x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCS601L",
          "name": "Advanced Java Programming Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BCS601",
          "name": "Advanced Java Programming",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS602",
          "name": "Information and Network Security",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCI603",
          "name": "High Performance Computing in Artificial Intelligence",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS604",
          "name": "Internet of Things",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX605x",
          "name": "Professional Elective Courses-II",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCSL606",
          "name": "IoT Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL607x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCS601L",
          "name": "Advanced Java Programming Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BCS601",
          "name": "Advanced Java Programming",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD602",
          "name": "Data Security & Privacy",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS603",
          "name": "High Performance Computing",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD604",
          "name": "Big Data Analytics",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX605x",
          "name": "Professional Elective Courses-II",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BDSL606",
          "name": "Big Data Analytics Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL607x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCS601L",
          "name": "Advanced Java Programming Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ISE": {
      "theory": [
        {
          "code": "1BIS601",
          "name": "Big Data analytics",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS602",
          "name": "Information and Network Security",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS603",
          "name": "Data Science and Visualization",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS604",
          "name": "Cloud Computing and Applications",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX605x",
          "name": "Professional Elective Courses-II",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BISL606",
          "name": "Data Science and Visualization Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL607x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BIS601L",
          "name": "Big Data Analytics Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BAD601",
          "name": "Natural Language Processing",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD602",
          "name": "Data Security & Privacy",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI603",
          "name": "Deep Learning",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD604",
          "name": "Big Data Analytics",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BXX605x",
          "name": "Professional Elective Courses-II",
          "department": "CS Allied",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BAIL606",
          "name": "Deep Learning Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BXXL607x",
          "name": "Ability Enhancement Course Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BAD601L",
          "name": "Natural Language Processing Laboratory",
          "department": "CS Allied",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ECE": {
      "theory": [
        {
          "code": "BEC601",
          "name": "Embedded System Design",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC602",
          "name": "VLSI Design and Testing",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEC613x",
          "name": "Professional Elective Course",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC654x",
          "name": "Open Elective Course",
          "department": "ECE/ETE",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BECL606",
          "name": "VLSI Design and Testing Lab",
          "department": "ECE/ETE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEC657x",
          "name": "Ability Enhancement Course/Skill Development Course V",
          "department": "ECE/ETE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEC601L",
          "name": "Embedded System Design Laboratory",
          "department": "ECE/ETE",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "EEE": {
      "theory": [
        {
          "code": "BEE601",
          "name": "Power system Analysis - I",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE602",
          "name": "Control Systems",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEE613x",
          "name": "Professional Elective Course",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE654x",
          "name": "Open Elective Course",
          "department": "EEE",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BEEL606",
          "name": "Control System Lab",
          "department": "EEE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEE657x",
          "name": "Ability Enhancement Course/Skill Development Course - V",
          "department": "EEE",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEE601L",
          "name": "Power system Analysis - I Laboratory",
          "department": "EEE",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ME": {
      "theory": [
        {
          "code": "BME601",
          "name": "Heat Transfer",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME602",
          "name": "Machine Design",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BME613x",
          "name": "Professional Elective - II",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME654x",
          "name": "Open Elective - I",
          "department": "ME",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BMEL606L",
          "name": "Design lab",
          "department": "ME",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BME657x",
          "name": "Ability Enhancement Course/Skill Development Course V",
          "department": "ME",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BME601L",
          "name": "Heat Transfer Laboratory",
          "department": "ME",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CIV": {
      "theory": [
        {
          "code": "BCV601",
          "name": "Design of RCC Structures",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV602",
          "name": "Irrigation Engineering and Hydraulic Structures",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BCV613x",
          "name": "Professional Elective Course",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV654x",
          "name": "Open Elective Course",
          "department": "CIVIL",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BCVL606",
          "name": "Software Application Lab",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCV657x",
          "name": "Ability Enhancement Course/Skill Development Course V",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCV601L",
          "name": "Design of RCC Structures Laboratory",
          "department": "CIVIL",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CH": {
      "theory": [
        {
          "code": "BCH601",
          "name": "Process Equipment Design and Drawing",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCH602",
          "name": "Mass Transfer Operations-II",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BCH613x",
          "name": "Professional Elective Course",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCH654x",
          "name": "Open Elective Course",
          "department": "CHEMICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BIKS609",
          "name": "Indian Knowledge System",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": [
        {
          "code": "BCHL606",
          "name": "Mass Transfer Operations lab-2",
          "department": "CHEMICAL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCH657x",
          "name": "Ability Enhancement Course/Skill Development Course V",
          "department": "CHEMICAL",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BCH601L",
          "name": "Process Equipment Design and Drawing Laboratory",
          "department": "CHEMICAL",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "BME": {
      "theory": [
        {
          "code": "BBM601",
          "name": "Medical Image Processing",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM602",
          "name": "Biomedical Digital Signal Processing",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BBM613x",
          "name": "Professional Elective Course",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM654x",
          "name": "Open Elective Course",
          "department": "BIOMEDICAL",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BIKS609",
          "name": "Indian Knowledge System",
          "department": "Humanities/Any",
          "category": "theory",
          "weekly_hours": 1
        }
      ],
      "practical": []
    }
  },
  "7": {
    "CSE": {
      "theory": [
        {
          "code": "1BCS701",
          "name": "Big Data Analytics",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS702",
          "name": "Professional Elective Course - III",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS703",
          "name": "Professional Elective Course - IV",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS704",
          "name": "Open Elective Course - I",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCSL701",
          "name": "Big Data Analytics Laboratory",
          "department": "Computer Science & Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BCD701",
          "name": "Deep Learning",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI702",
          "name": "Professional Elective Course - III",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI703",
          "name": "Professional Elective Course - IV",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI704",
          "name": "Open Elective Course - I",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCDL701",
          "name": "Deep Learning Laboratory",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BCD701",
          "name": "Deep Learning",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BDS702",
          "name": "Professional Elective Course - III",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BDS703",
          "name": "Professional Elective Course - IV",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BDS704",
          "name": "Open Elective Course - I",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCDL701",
          "name": "Deep Learning Laboratory",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ISE": {
      "theory": [
        {
          "code": "1BIS701",
          "name": "High Performance Computing",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS702",
          "name": "Professional Elective Course - III",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS703",
          "name": "Professional Elective Course - IV",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS704",
          "name": "Open Elective Course - I",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BISL701",
          "name": "High Performance Computing Laboratory",
          "department": "Information Science & Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BAD701",
          "name": "High Performance Computing in Artificial Intelligence",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD702",
          "name": "Professional Elective Course - III",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD703",
          "name": "Professional Elective Course - IV",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD704",
          "name": "Open Elective Course - I",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BADL701",
          "name": "High Performance Computing in AI Laboratory",
          "department": "Artificial Intelligence & Data Science",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ECE": {
      "theory": [
        {
          "code": "BEC701",
          "name": "Microwave Engineering and Antenna Theory",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC702",
          "name": "Computer Networks and Protocols",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC703",
          "name": "Wireless Communication Systems",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEC714",
          "name": "Professional Elective Course",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC755",
          "name": "Open Elective Course",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BECL701",
          "name": "Microwave Engineering & Antenna Laboratory",
          "department": "Electronics & Communication Engineering",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BECL702",
          "name": "Computer Networks & Protocols Laboratory",
          "department": "Electronics & Communication Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "EEE": {
      "theory": [
        {
          "code": "BEE701",
          "name": "Switchgear and Protection",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE702",
          "name": "Industrial Drives and Applications",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BEE703",
          "name": "Power System Analysis - II",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE714",
          "name": "Professional Elective Course",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE755",
          "name": "Open Elective Course",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BEEL701",
          "name": "Switchgear & Protection Laboratory",
          "department": "Electrical & Electronics Engineering",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BEEL703",
          "name": "Power System Analysis - II Laboratory",
          "department": "Electrical & Electronics Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "ME": {
      "theory": [
        {
          "code": "BME701",
          "name": "Finite Element Methods",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME702",
          "name": "Hydraulics and Pneumatics",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME703",
          "name": "Control Engineering",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BME714",
          "name": "Professional Elective - III",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME755",
          "name": "Open Elective - II",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "BMEL701",
          "name": "Finite Element Methods Laboratory",
          "department": "Mechanical Engineering",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "BMEL702",
          "name": "Hydraulics & Pneumatics Laboratory",
          "department": "Mechanical Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "CIV": {
      "theory": [
        {
          "code": "1BCV701",
          "name": "Design & Detailing of Steel Structures",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV702",
          "name": "Professional Elective Course - III",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV703",
          "name": "Professional Elective Course - IV",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCV704",
          "name": "Open Elective Course - I",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCVL701",
          "name": "Design & Detailing of Steel Structures Laboratory",
          "department": "Civil Engineering",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    },
    "BME": {
      "theory": [
        {
          "code": "BBM701",
          "name": "Biomechanics and Biodynamics",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM702",
          "name": "ARM Processor",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM703",
          "name": "Biometric System",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "BBM714",
          "name": "Professional Elective Course",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM755",
          "name": "Open Elective Course",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "CH": {
      "theory": [
        {
          "code": "1BCH701",
          "name": "Transport Phenomena",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 4
        },
        {
          "code": "1BCH702",
          "name": "Chemical Process Modeling & Simulation",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH703",
          "name": "Petroleum Refining & Petrochemicals",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCH704",
          "name": "Professional Elective Course - III",
          "department": "Chem Dept",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": [
        {
          "code": "1BCHL705",
          "name": "Process Modeling & Simulation Lab",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        },
        {
          "code": "1BCHP706",
          "name": "Project Work Phase-I",
          "department": "Chem Dept",
          "category": "practical",
          "weekly_hours": 2
        }
      ]
    }
  },
  "8": {
    "CSE": {
      "theory": [
        {
          "code": "1BCS801",
          "name": "Professional Elective-V (NPTEL/VTU Online Course)",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BCS802",
          "name": "Open Elective-II (NPTEL/VTU Online Course)",
          "department": "Computer Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "CSE-AIML": {
      "theory": [
        {
          "code": "1BAI801",
          "name": "Professional Elective-V (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAI802",
          "name": "Open Elective-II (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "CSE-DS": {
      "theory": [
        {
          "code": "1BDS801",
          "name": "Professional Elective-V (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BDS802",
          "name": "Open Elective-II (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Machine Learning",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "ISE": {
      "theory": [
        {
          "code": "1BIS801",
          "name": "Professional Elective-V (NPTEL/VTU Online Course)",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BIS802",
          "name": "Open Elective-II (NPTEL/VTU Online Course)",
          "department": "Information Science & Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "AI&DS": {
      "theory": [
        {
          "code": "1BAD801",
          "name": "Professional Elective-V (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "1BAD802",
          "name": "Open Elective-II (NPTEL/VTU Online Course)",
          "department": "Artificial Intelligence & Data Science",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "ECE": {
      "theory": [
        {
          "code": "BEC801",
          "name": "Professional Elective (Online Courses)",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEC802",
          "name": "Open Elective (Online Courses)",
          "department": "Electronics & Communication Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "EEE": {
      "theory": [
        {
          "code": "BEE801",
          "name": "Professional Elective (Online Courses)",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BEE802",
          "name": "Open Elective (Online Courses)",
          "department": "Electrical & Electronics Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "ME": {
      "theory": [
        {
          "code": "BME811",
          "name": "Professional Elective -IV (Online Courses)",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BME852",
          "name": "Open Elective - III (Online Courses)",
          "department": "Mechanical Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "CIV": {
      "theory": [
        {
          "code": "BCV801",
          "name": "Professional Elective (Online Courses)",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCV802",
          "name": "Open Elective (Online Courses)",
          "department": "Civil Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "CH": {
      "theory": [
        {
          "code": "BCH801",
          "name": "Professional Elective (Online Courses)",
          "department": "Chemical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BCH802",
          "name": "Open Elective (Online Courses)",
          "department": "Chemical Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    },
    "BME": {
      "theory": [
        {
          "code": "BBM801",
          "name": "Professional Elective (Online Courses)",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        },
        {
          "code": "BBM802",
          "name": "Open Elective (Online Courses)",
          "department": "Biomedical Engineering",
          "category": "theory",
          "weekly_hours": 3
        }
      ],
      "practical": []
    }
  }
};
