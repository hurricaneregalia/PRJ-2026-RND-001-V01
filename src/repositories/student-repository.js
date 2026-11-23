// src/repositories/student-repository.js

import "server-only";

export { getAllStudents, getStudentById, getStudentByNumber } from "./student-repository-read";

export { createStudent, createStudentsBulk, updateStudent } from "./student-repository-write";
