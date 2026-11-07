// Type Imports
import type { ThemeColor } from '../base'

export type Course = {
  id: number
  image: string
  user: string
  tutorImg: string
  completedTasks: number
  totalTasks: number
  userCount: number
  note: number
  view: number
  time: string
  logo: string
  courseTitle: string
  color: ThemeColor
  desc: string
  tags: string
  rating: number
  ratingCount: number
}

export type CourseDetails = {
  title: string
  about: string
  instructor: string
  instructorAvatar: string
  instructorPosition: string
  skillLevel: string
  totalLectures: number
  totalStudents: number
  isCaptions: boolean
  language: string
  length: string
  content: CourseContent[]
  description: string[]
}

export type CourseContent = {
  title: string
  id: string
  topics: CourseTopic[]
}

export type CourseTopic = {
  title: string
  time: string
  isCompleted: boolean
}

export type ColoredCard = {
  title: string
  description: string
  type: string
  image: string
  color: ThemeColor
  imageColorClass?: string
  bgColorClass?: string
}

export type AcademyInstructor = {
  name: string
  profession: string
  totalCourses: number
  avatar: string
}

export type AcademyTopCourse = {
  title: string
  views: string
  icon: string
  color: ThemeColor
}

export type AcademyAssignment = {
  title: string
  tasks: number
  progress: number
  color: ThemeColor
}

export type AcademyWebinarItem = {
  icon: string
  title: string
  value: string
}

export type AcademyTopicStat = {
  title: string
  value: number
  colorClass: string
}

export type AcademyType = {
  courses: Course[]
  courseDetails: CourseDetails
  coloredCards: ColoredCard[]
  popularInstructors: AcademyInstructor[]
  topCourses: AcademyTopCourse[]
  assignmentProgress: AcademyAssignment[]
  upcomingWebinar: AcademyWebinarItem[]
  interestedTopicsData1: AcademyTopicStat[]
  interestedTopicsData2: AcademyTopicStat[]
}
