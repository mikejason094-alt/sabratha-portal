import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Student from './models/Student.js'
import Semester from './models/Semester.js'
import Course from './models/Course.js'
import Lecture from './models/Lecture.js'
import News from './models/News.js'

export async function seedDatabase() {
  const existing = await Student.countDocuments()
  if (existing > 0) {
    console.log('Database already has data, skipping seed')
    return
  }

  console.log('Seeding database...')

  const student = await Student.create({
    studentId: 'SITS-2022-0047',
    nameEn: 'Islam Almuneer Alhawwari',
    nameAr: 'إسلام المنير الحواري',
    email: 'islam.alhawwari@sits.edu.ly',
    department: 'Computer Engineering',
    departmentAr: 'هندسة الحاسوب',
    enrollmentYear: 2022,
    currentSemester: 5,
    gpa: 3.42,
    totalCredits: 72,
  })

  const hashedPassword = await bcrypt.hash('student123', 12)
  await User.create({ email: 'islam.alhawwari@sits.edu.ly', password: hashedPassword, role: 'student', studentId: student.studentId })
  await User.create({ email: 'admin@sits.edu.ly', password: hashedPassword, role: 'admin' })

  await Semester.insertMany([
    {
      studentId: student.studentId, semesterNumber: 1, nameEn: 'Semester 1', nameAr: 'الفصل الأول',
      year: '2022-2023', status: 'completed', gpa: 3.10, credits: 15,
      courses: [
        { code: 'CS101', nameEn: 'Introduction to Programming', nameAr: 'مقدمة في البرمجة', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'MTH101', nameEn: 'Calculus I', nameAr: 'التفاضل و التكامل 1', credits: 3, grade: 'B', points: 3.00 },
        { code: 'PHY101', nameEn: 'Physics I', nameAr: 'الفيزياء 1', credits: 3, grade: 'B-', points: 2.67 },
        { code: 'ENG101', nameEn: 'English I', nameAr: 'اللغة الإنجليزية 1', credits: 3, grade: 'A-', points: 3.67 },
        { code: 'ARB101', nameEn: 'Arabic Language', nameAr: 'اللغة العربية', credits: 3, grade: 'A', points: 4.00 },
      ],
    },
    {
      studentId: student.studentId, semesterNumber: 2, nameEn: 'Semester 2', nameAr: 'الفصل الثاني',
      year: '2022-2023', status: 'completed', gpa: 3.27, credits: 15,
      courses: [
        { code: 'CS102', nameEn: 'Object-Oriented Programming', nameAr: 'البرمجة كائنية التوجه', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'MTH102', nameEn: 'Calculus II', nameAr: 'التفاضل و التكامل 2', credits: 3, grade: 'B', points: 3.00 },
        { code: 'PHY102', nameEn: 'Physics II', nameAr: 'الفيزياء 2', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, grade: 'B', points: 3.00 },
        { code: 'MTH201', nameEn: 'Linear Algebra', nameAr: 'الجبر الخطي', credits: 3, grade: 'A-', points: 3.67 },
      ],
    },
    {
      studentId: student.studentId, semesterNumber: 3, nameEn: 'Semester 3', nameAr: 'الفصل الثالث',
      year: '2023-2024', status: 'completed', gpa: 3.53, credits: 15,
      courses: [
        { code: 'CS202', nameEn: 'Algorithms', nameAr: 'الخوارزميات', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'CS301', nameEn: 'Database Systems', nameAr: 'نظم قواعد البيانات', credits: 3, grade: 'A-', points: 3.67 },
        { code: 'CS302', nameEn: 'Computer Networks', nameAr: 'شبكات الحاسوب', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'MTH301', nameEn: 'Probability & Statistics', nameAr: 'الاحتمالات و الإحصاء', credits: 3, grade: 'A-', points: 3.67 },
        { code: 'ENG201', nameEn: 'Technical English', nameAr: 'الإنجليزية التقنية', credits: 3, grade: 'B+', points: 3.33 },
      ],
    },
    {
      studentId: student.studentId, semesterNumber: 4, nameEn: 'Semester 4', nameAr: 'الفصل الرابع',
      year: '2023-2024', status: 'completed', gpa: 3.67, credits: 15,
      courses: [
        { code: 'CS303', nameEn: 'Operating Systems', nameAr: 'نظم التشغيل', credits: 3, grade: 'A-', points: 3.67 },
        { code: 'CS304', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, grade: 'B+', points: 3.33 },
        { code: 'CS401', nameEn: 'Web Development', nameAr: 'تطوير الويب', credits: 3, grade: 'A', points: 4.00 },
        { code: 'CS402', nameEn: 'Artificial Intelligence', nameAr: 'الذكاء الاصطناعي', credits: 3, grade: 'A-', points: 3.67 },
        { code: 'MTH302', nameEn: 'Discrete Mathematics', nameAr: 'الرياضيات المتقطعة', credits: 3, grade: 'B+', points: 3.33 },
      ],
    },
    {
      studentId: student.studentId, semesterNumber: 5, nameEn: 'Semester 5', nameAr: 'الفصل الخامس',
      year: '2024-2025', status: 'in-progress', gpa: null, credits: 12,
      courses: [
        { code: 'CS403', nameEn: 'Machine Learning', nameAr: 'تعلم الآلة', credits: 3, grade: null, points: null },
        { code: 'CS404', nameEn: 'Cybersecurity', nameAr: 'الأمن السيبراني', credits: 3, grade: null, points: null },
        { code: 'CS501', nameEn: 'Mobile App Development', nameAr: 'تطوير تطبيقات الجوال', credits: 3, grade: null, points: null },
        { code: 'CS502', nameEn: 'Cloud Computing', nameAr: 'الحوسبة السحابية', credits: 3, grade: null, points: null },
      ],
    },
  ])

  await Course.insertMany([
    { code: 'CS403', nameEn: 'Machine Learning', nameAr: 'تعلم الآلة', credits: 3, instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون', scheduleEn: 'Sun/Tue 10:00-11:30', scheduleAr: 'أحد/ثلاثاء 10:00-11:30', room: 'Lab 201', capacity: 30, enrolled: 24, semester: 5 },
    { code: 'CS404', nameEn: 'Cybersecurity', nameAr: 'الأمن السيبراني', credits: 3, instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم', scheduleEn: 'Mon/Wed 08:30-10:00', scheduleAr: 'إثنين/أربعاء 08:30-10:00', room: 'Hall B', capacity: 40, enrolled: 32, semester: 5 },
    { code: 'CS501', nameEn: 'Mobile App Development', nameAr: 'تطوير تطبيقات الجوال', credits: 3, instructorEn: 'Eng. Khaled Al-Mahdi', instructorAr: 'م. خالد المهدي', scheduleEn: 'Sun/Tue 13:00-14:30', scheduleAr: 'أحد/ثلاثاء 13:00-14:30', room: 'Lab 102', capacity: 25, enrolled: 20, semester: 5 },
    { code: 'CS502', nameEn: 'Cloud Computing', nameAr: 'الحوسبة السحابية', credits: 3, instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء', scheduleEn: 'Mon/Wed 11:00-12:30', scheduleAr: 'إثنين/أربعاء 11:00-12:30', room: 'Lab 201', capacity: 30, enrolled: 18, semester: 5 },
    { code: 'EE301', nameEn: 'Digital Logic Design', nameAr: 'تصميم المنطق الرقمي', credits: 3, instructorEn: 'Dr. Omar Al-Mansouri', instructorAr: 'د. عمر المنصوري', scheduleEn: 'Sun/Tue 08:30-10:00', scheduleAr: 'أحد/ثلاثاء 08:30-10:00', room: 'Hall A', capacity: 35, enrolled: 30, semester: 5 },
    { code: 'EE302', nameEn: 'Microprocessors', nameAr: 'المعالجات الدقيقة', credits: 3, instructorEn: 'Eng. Ali Al-Trabulsi', instructorAr: 'م. علي الطرابلسي', scheduleEn: 'Mon/Wed 14:00-15:30', scheduleAr: 'إثنين/أربعاء 14:00-15:30', room: 'Lab 101', capacity: 25, enrolled: 25, semester: 5 },
    { code: 'CS201', nameEn: 'Data Structures', nameAr: 'هياكل البيانات', credits: 3, instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون', scheduleEn: 'Sun/Tue 11:00-12:30', scheduleAr: 'أحد/ثلاثاء 11:00-12:30', room: 'Hall B', capacity: 40, enrolled: 38, semester: 3 },
    { code: 'CS303', nameEn: 'Operating Systems', nameAr: 'نظم التشغيل', credits: 3, instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم', scheduleEn: 'Mon/Wed 10:00-11:30', scheduleAr: 'إثنين/أربعاء 10:00-11:30', room: 'Hall A', capacity: 35, enrolled: 33, semester: 4 },
    { code: 'CS304', nameEn: 'Software Engineering', nameAr: 'هندسة البرمجيات', credits: 3, instructorEn: 'Eng. Khaled Al-Mahdi', instructorAr: 'م. خالد المهدي', scheduleEn: 'Sun/Tue 14:00-15:30', scheduleAr: 'أحد/ثلاثاء 14:00-15:30', room: 'Hall A', capacity: 35, enrolled: 28, semester: 4 },
    { code: 'CS401', nameEn: 'Web Development', nameAr: 'تطوير الويب', credits: 3, instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء', scheduleEn: 'Mon/Wed 08:30-10:00', scheduleAr: 'إثنين/أربعاء 08:30-10:00', room: 'Lab 102', capacity: 25, enrolled: 22, semester: 4 },
  ])

  await Lecture.insertMany([
    { courseCode: 'CS403', courseEn: 'Machine Learning', courseAr: 'تعلم الآلة', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '10:00 - 11:30', room: 'Lab 201', instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون' },
    { courseCode: 'CS403', courseEn: 'Machine Learning', courseAr: 'تعلم الآلة', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '10:00 - 11:30', room: 'Lab 201', instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون' },
    { courseCode: 'CS404', courseEn: 'Cybersecurity', courseAr: 'الأمن السيبراني', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '08:30 - 10:00', room: 'Hall B', instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم' },
    { courseCode: 'CS404', courseEn: 'Cybersecurity', courseAr: 'الأمن السيبراني', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '08:30 - 10:00', room: 'Hall B', instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم' },
    { courseCode: 'CS501', courseEn: 'Mobile App Development', courseAr: 'تطوير تطبيقات الجوال', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '13:00 - 14:30', room: 'Lab 102', instructorEn: 'Eng. Khaled Al-Mahdi', instructorAr: 'م. خالد المهدي' },
    { courseCode: 'CS501', courseEn: 'Mobile App Development', courseAr: 'تطوير تطبيقات الجوال', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '13:00 - 14:30', room: 'Lab 102', instructorEn: 'Eng. Khaled Al-Mahdi', instructorAr: 'م. خالد المهدي' },
    { courseCode: 'CS502', courseEn: 'Cloud Computing', courseAr: 'الحوسبة السحابية', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '11:00 - 12:30', room: 'Lab 201', instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء' },
    { courseCode: 'CS502', courseEn: 'Cloud Computing', courseAr: 'الحوسبة السحابية', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '11:00 - 12:30', room: 'Lab 201', instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء' },
    { courseCode: 'EE301', courseEn: 'Digital Logic Design', courseAr: 'تصميم المنطق الرقمي', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '08:30 - 10:00', room: 'Hall A', instructorEn: 'Dr. Omar Al-Mansouri', instructorAr: 'د. عمر المنصوري' },
    { courseCode: 'EE301', courseEn: 'Digital Logic Design', courseAr: 'تصميم المنطق الرقمي', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '08:30 - 10:00', room: 'Hall A', instructorEn: 'Dr. Omar Al-Mansouri', instructorAr: 'د. عمر المنصوري' },
    { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'sunday', dayEn: 'Sunday', dayAr: 'الأحد', time: '11:00 - 12:30', room: 'Hall B', instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون' },
    { courseCode: 'CS201', courseEn: 'Data Structures', courseAr: 'هياكل البيانات', day: 'tuesday', dayEn: 'Tuesday', dayAr: 'الثلاثاء', time: '11:00 - 12:30', room: 'Hall B', instructorEn: 'Dr. Sarah Johnson', instructorAr: 'د. سارة جونسون' },
    { courseCode: 'CS303', courseEn: 'Operating Systems', courseAr: 'نظم التشغيل', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '10:00 - 11:30', room: 'Hall A', instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم' },
    { courseCode: 'CS303', courseEn: 'Operating Systems', courseAr: 'نظم التشغيل', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '10:00 - 11:30', room: 'Hall A', instructorEn: 'Dr. Ahmed Ben Salem', instructorAr: 'د. أحمد بن سالم' },
    { courseCode: 'CS401', courseEn: 'Web Development', courseAr: 'تطوير الويب', day: 'monday', dayEn: 'Monday', dayAr: 'الإثنين', time: '08:30 - 10:00', room: 'Lab 102', instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء' },
    { courseCode: 'CS401', courseEn: 'Web Development', courseAr: 'تطوير الويب', day: 'wednesday', dayEn: 'Wednesday', dayAr: 'الأربعاء', time: '08:30 - 10:00', room: 'Lab 102', instructorEn: 'Dr. Fatima Al-Zahra', instructorAr: 'د. فاطمة الزهراء' },
  ])

  await News.insertMany([
    { titleEn: 'Registration for Semester 5 Now Open', titleAr: 'التسجيل للفصل الخامس مفتوح الآن', summaryEn: 'Course registration for the Fall 2025 semester is now open.', summaryAr: 'التسجيل في المقررات للفصل الخريفي 2025 مفتوح الآن.', contentEn: 'Dear students, registration for Semester 5 of the academic year 2024-2025 is now open. You can register for your courses through the student portal until October 15th.', contentAr: 'أيها الطلاب، التسجيل للفصل الخامس من العام الجامعي 2024-2025 مفتوح الآن. يمكنكم التسجيل في مقرراتكم عبر بوابة الطالب حتى 15 أكتوبر.', category: 'announcement', date: new Date('2025-09-01'), author: 'Academic Affairs' },
    { titleEn: 'Annual Science & Technology Fair', titleAr: 'المعرض السنوي للعلوم و التكنولوجيا', summaryEn: 'SITS is hosting its annual Science & Technology Fair.', summaryAr: 'ينظم المعهد معرضه السنوي للعلوم و التكنولوجيا.', contentEn: 'The Sabratha Institute of Technical Sciences is proud to announce its 3rd Annual Science and Technology Fair, to be held on November 20-22, 2025.', contentAr: 'يعلن معهد صبراتة للتقنية و العلوم التطبيقية عن معرضه السنوي الثالث للعلوم و التكنولوجيا.', category: 'event', date: new Date('2025-08-28'), author: 'Student Affairs' },
    { titleEn: 'New Partnership with Libyan Tech Companies', titleAr: 'شراكة جديدة مع شركات التقنية الليبية', summaryEn: 'SITS has signed MoUs with leading Libyan technology companies.', summaryAr: 'وقع المعهد مذكرات تفاهم مع شركات تقنية ليبية رائدة.', contentEn: 'We are pleased to announce that SITS has signed memoranda of understanding with three leading Libyan technology companies.', contentAr: 'يسرنا الإعلان عن توقيع المعهد مذكرات تفاهم مع ثلاث شركات تقنية ليبية رائدة.', category: 'announcement', date: new Date('2025-08-20'), author: "Dean's Office" },
    { titleEn: 'Midterm Exam Schedule Released', titleAr: 'جدول الامتحانات النصفية', summaryEn: 'The midterm exam schedule for Semester 5 has been published.', summaryAr: 'تم نشر جدول الامتحانات النصفية للفصل الخامس.', contentEn: 'The midterm examination schedule for Semester 5 (2024-2025) is now available.', contentAr: 'جدول الامتحانات النصفية للفصل الخامس (2024-2025) متاح الآن.', category: 'announcement', date: new Date('2025-08-15'), author: 'Examinations Committee' },
    { titleEn: 'Guest Lecture: AI in Healthcare', titleAr: 'محاضرة ضيف: الذكاء الاصطناعي في الرعاية الصحية', summaryEn: 'A guest lecture by Dr. Hassan Al-Mahdi on AI in healthcare.', summaryAr: 'محاضرة ضيف يلقيها د. حسن المهدي حول تطبيقات الذكاء الاصطناعي.', contentEn: 'The Computer Engineering Department invites you to a guest lecture by Dr. Hassan Al-Mahdi.', contentAr: 'يدعوكم قسم هندسة الحاسوب إلى محاضرة ضيف يلقيها د. حسن المهدي.', category: 'event', date: new Date('2025-08-10'), author: 'Computer Engineering Dept.' },
    { titleEn: 'Library Extended Hours During Exams', titleAr: 'ساعات العمل الموسعة للمكتبة أثناء الامتحانات', summaryEn: 'The institute library will remain open until 8 PM during exams.', summaryAr: 'ستظل مكتبة المعهد مفتوحة حتى الساعة 8 مساءً خلال الامتحانات.', contentEn: 'To support students during exams, the library will extend its hours.', contentAr: 'دعماً للطلاب خلال الامتحانات، ستمدد المكتبة ساعات عملها.', category: 'announcement', date: new Date('2025-08-05'), author: 'Library Administration' },
  ])

  console.log('Database seeded successfully')
  console.log('Login: islam.alhawwari@sits.edu.ly / student123')
}
