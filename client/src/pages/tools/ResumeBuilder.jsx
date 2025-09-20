import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Star,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Plus,
  Save,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import backEndURL from "../../hooks/helper";

export function ResumeBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeSection, setActiveSection] = useState("personal");
  const [resumeData, setResumeData] = useState({
    personal: {
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      website: "johndoe.dev",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
  });
  const [modal, setModal] = useState({ open: false, section: null, editIndex: -1 });
  const [modalForm, setModalForm] = useState({});
  const [analyzeTab, setAnalyzeTab] = useState({
    file: null,
    text: "",
    job: "",
  });
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState(null);


  const sections = [
    { id: "personal", name: "Personal Info", icon: User, completed: true },
    {
      id: "summary",
      name: "Professional Summary",
      icon: FileText,
      completed: false,
    },
    {
      id: "experience",
      name: "Work Experience",
      icon: Briefcase,
      completed: false,
    },
    {
      id: "education",
      name: "Education",
      icon: GraduationCap,
      completed: false,
    },
    { id: "skills", name: "Skills", icon: Star, completed: false },
    { id: "projects", name: "Projects", icon: Target, completed: false },
  ];

  

  async function uploadResumeFile(file) {
    const form = new FormData();
    form.append("resume", file);
    const res = await fetch(`${backEndURL}/api/resume/upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  }

  async function analyzeResume() {
    setAnalyzeError("");
    setAnalyzeResult(null);
    if (!analyzeTab.job.trim()) {
      setAnalyzeError("Job description is required");
      return;
    }
    setAnalyzeLoading(true);
    try {
      let payload;
      if (analyzeTab.text.trim()) {
        payload = {
          resume_text: analyzeTab.text.trim(),
          job_description: analyzeTab.job.trim(),
        };
      } else if (analyzeTab.file) {
        const uploaded = await uploadResumeFile(analyzeTab.file);
        payload = {
          public_id: uploaded.public_id,
          file_format: analyzeTab.file.name.toLowerCase().endsWith(".docx")
            ? "docx"
            : "pdf",
          job_description: analyzeTab.job.trim(),
        };
      } else {
        throw new Error("Provide resume text or upload a file");
      }
      const res = await fetch(`${backEndURL}/api/resume/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalyzeResult(data.analysis);
    } catch (e) {
      setAnalyzeError(e.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  function openAddModal(section) {
    setModal({ open: true, section, editIndex: -1 });
    // default form shape per section
    if (section === "experience")
      setModalForm({ company: "", title: "", start: "", end: "", description: "" });
    else if (section === "education")
      setModalForm({ school: "", degree: "", start: "", end: "", description: "" });
    else if (section === "skills") setModalForm({ name: "", level: "" });
    else if (section === "projects")
      setModalForm({ name: "", link: "", description: "" });
    else setModalForm({});
  }

  function closeModal() {
    setModal({ open: false, section: null, editIndex: -1 });
    setModalForm({});
  }

  async function saveModal() {
    const section = modal.section;
    if (!section) return;
    setResumeData((prev) => {
      const copy = { ...prev };
      if (modal.editIndex >= 0) {
        // edit existing
        copy[section] = [...(copy[section] || [])];
        copy[section][modal.editIndex] = modalForm;
      } else {
        copy[section] = [...(copy[section] || []), modalForm];
      }
      return copy;
    });
    closeModal();

    // If job description is present, auto-run analysis for updated resume
    if (analyzeTab.job?.trim()) {
      // assemble plain-text resume
      const pieces = [];
      const p = resumeData.personal || {};
      pieces.push(`Name: ${p.name || ""}`);
      if (p.email) pieces.push(`Email: ${p.email}`);
      if (p.phone) pieces.push(`Phone: ${p.phone}`);
      if (p.location) pieces.push(`Location: ${p.location}`);
      if (p.website) pieces.push(`Website: ${p.website}`);

      const updated = { ...resumeData };
      // apply modal change locally for the payload
      updated[section] = updated[section] || [];
      if (modal.editIndex >= 0) {
        updated[section] = [...updated[section]];
        updated[section][modal.editIndex] = modalForm;
      } else {
        updated[section] = [...updated[section], modalForm];
      }

      if (updated.summary) {
        pieces.push("Professional Summary:");
        pieces.push(updated.summary);
      }

      if (updated.experience && updated.experience.length) {
        pieces.push("Work Experience:");
        updated.experience.forEach((e) => {
          pieces.push(`- ${e.title || ""} | ${e.company || ""} | ${e.start || ""} - ${e.end || ""}`);
          if (e.description) pieces.push(`  ${e.description}`);
        });
      }

      if (updated.education && updated.education.length) {
        pieces.push("Education:");
        updated.education.forEach((ed) => {
          pieces.push(`- ${ed.degree || ""} | ${ed.school || ""} | ${ed.start || ""} - ${ed.end || ""}`);
          if (ed.description) pieces.push(`  ${ed.description}`);
        });
      }

      if (updated.skills && updated.skills.length) {
        pieces.push("Skills:");
        pieces.push(updated.skills.map((s) => `${s.name}${s.level ? ` (${s.level})` : ""}`).join(", "));
      }

      if (updated.projects && updated.projects.length) {
        pieces.push("Projects:");
        updated.projects.forEach((pr) => {
          pieces.push(`- ${pr.name || ""}${pr.link ? ` (${pr.link})` : ""}`);
          if (pr.description) pieces.push(`  ${pr.description}`);
        });
      }

      const resume_text = pieces.join("\n");
      const payload = { resume_text, job_description: analyzeTab.job.trim() };

      try {
        setSubmitLoading(true);
        const res = await fetch(`${backEndURL}/api/resume/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");

        setAnalyzeResult(data.analysis || null);
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setSubmitLoading(false);
      }
    }
  }

  function deleteItem(section, index) {
    setResumeData((prev) => {
      const copy = { ...prev };
      copy[section] = (copy[section] || []).filter((_, i) => i !== index);
      return copy;
    });
  }

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function submitResume() {
    setSubmitError("");
    // minimal validation: name must exist
    if (!resumeData.personal?.name?.trim()) {
      setSubmitError("Full name is required in Personal Info");
      return;
    }

    // If a job description is provided in the Analyze tab, call the analyze endpoint.
    // Otherwise treat Builder submit as a local save (no analysis required).

    // Build a simple plain-text resume from the structured data
    const pieces = [];
    const p = resumeData.personal || {};
    pieces.push(`Name: ${p.name || ""}`);
    if (p.email) pieces.push(`Email: ${p.email}`);
    if (p.phone) pieces.push(`Phone: ${p.phone}`);
    if (p.location) pieces.push(`Location: ${p.location}`);
    if (p.website) pieces.push(`Website: ${p.website}`);

    if (resumeData.experience && resumeData.experience.length) {
      pieces.push("Work Experience:");
      resumeData.experience.forEach((e) => {
        pieces.push(`- ${e.title || ""} | ${e.company || ""} | ${e.start || ""} - ${e.end || ""}`);
        if (e.description) pieces.push(`  ${e.description}`);
      });
    }

    // Include professional summary if present
    if (resumeData.summary && resumeData.summary.trim()) {
      pieces.splice(1, 0, "Professional Summary:", resumeData.summary);
    }

    if (resumeData.education && resumeData.education.length) {
      pieces.push("Education:");
      resumeData.education.forEach((ed) => {
        pieces.push(`- ${ed.degree || ""} | ${ed.school || ""} | ${ed.start || ""} - ${ed.end || ""}`);
        if (ed.description) pieces.push(`  ${ed.description}`);
      });
    }

    if (resumeData.skills && resumeData.skills.length) {
      pieces.push("Skills:");
      pieces.push(resumeData.skills.map((s) => `${s.name}${s.level ? ` (${s.level})` : ""}`).join(", "));
    }

    if (resumeData.projects && resumeData.projects.length) {
      pieces.push("Projects:");
      resumeData.projects.forEach((pr) => {
        pieces.push(`- ${pr.name || ""}${pr.link ? ` (${pr.link})` : ""}`);
        if (pr.description) pieces.push(`  ${pr.description}`);
      });
    }

    const resume_text = pieces.join("\n");

    if (analyzeTab.job?.trim()) {
      const payload = {
        resume_text,
        job_description: analyzeTab.job.trim(),
      };

      try {
        setSubmitLoading(true);
        const res = await fetch(`${backEndURL}/api/resume/builder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");

        // show analysis result in the Analyze panel
        setAnalyzeResult(data.analysis || null);
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setSubmitLoading(false);
      }
    } else {
      // No job description provided: treat as local save. Clear any prior analysis errors.
      setSubmitError("");
      setAnalyzeResult(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Resume Builder
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          AI-powered resume optimization and ATS scoring to land your dream job
        </p>
      </div>

      <Tabs defaultValue="analyze" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-1">
          <TabsTrigger value="analyze" className="text-xs sm:text-sm py-2">Analyze</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs sm:text-sm py-2">Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4 sm:space-y-6">
          {analyzeError && (
            <div className="p-3 text-xs sm:text-sm rounded bg-red-100 text-red-700 border border-red-200">
              {analyzeError}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                Analyze Resume vs Job Description
              </CardTitle>
              <CardDescription>
                Upload a PDF/DOCX or paste your resume text, and provide the job
                description (required).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Upload Resume (PDF/DOCX)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag & drop or click to select file
                    </p>
                    <input
                      type="file"
                      accept="application/pdf,.docx"
                      id="resume-file"
                      className="hidden"
                      onChange={(e) =>
                        setAnalyzeTab((prev) => ({
                          ...prev,
                          file: e.target.files?.[0] || null,
                        }))
                      }
                    />
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <label
                        htmlFor="resume-file"
                        className="cursor-pointer w-full h-full flex items-center justify-center"
                      >
                        Select File
                      </label>
                    </Button>
                    {analyzeTab.file && (
                      <p className="mt-2 text-xs text-blue-600">
                        Selected: {analyzeTab.file.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Or Paste Resume Text
                    </label>
                    <textarea
                      className="w-full h-40 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Paste your resume text here..."
                      value={analyzeTab.text}
                      onChange={(e) =>
                        setAnalyzeTab((prev) => ({
                          ...prev,
                          text: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Job Description (required)
                  </label>
                  <textarea
                    className="w-full h-64 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste the job description here..."
                    value={analyzeTab.job}
                    onChange={(e) =>
                      setAnalyzeTab((prev) => ({
                        ...prev,
                        job: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={analyzeResume}
                    disabled={
                      analyzeLoading ||
                      !analyzeTab.job.trim() ||
                      (!analyzeTab.file && !analyzeTab.text.trim())
                    }
                    className="w-full text-sm sm:text-base py-2 sm:py-3"
                  >
                    {analyzeLoading ? "Analyzing..." : "Analyze Resume"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {analyzeResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">
                  Analysis Result
                </CardTitle>
                <CardDescription>
                  Insights and recommendations tailored to the job description.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Top row: Score + Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative inline-flex">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            className="text-gray-200"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="48"
                            cy="48"
                          />
                          <circle
                            className="text-blue-600"
                            strokeWidth="8"
                            strokeDasharray={`${
                              Math.min(
                                100,
                                Math.max(0, analyzeResult.match_score ?? 0)
                              ) * 2.76
                            } 276`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="44"
                            cx="48"
                            cy="48"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                          {typeof analyzeResult.match_score !== "undefined"
                            ? analyzeResult.match_score
                            : "--"}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Match Score
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    {analyzeResult.summary && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Summary
                        </h4>
                        <p className="text-sm text-blue-800">
                          {analyzeResult.summary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Strengths</h4>
                    <div className="space-y-2">
                      {(analyzeResult.strengths || []).map((s, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md bg-green-50 border border-green-100 text-sm text-green-900"
                        >
                          {s}
                        </div>
                      ))}
                      {(!analyzeResult.strengths ||
                        analyzeResult.strengths.length === 0) && (
                        <p className="text-xs text-gray-500">
                          No strengths identified.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2">Improvements</h4>
                    <div className="space-y-2">
                      {(analyzeResult.improvements || []).map((s, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md bg-yellow-50 border border-yellow-100 text-sm text-yellow-900"
                        >
                          {s}
                        </div>
                      ))}
                      {(!analyzeResult.improvements ||
                        analyzeResult.improvements.length === 0) && (
                        <p className="text-xs text-gray-500">
                          No improvement suggestions.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Resume Sections */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Resume Sections
                  </CardTitle>
                  <CardDescription>
                    Complete each section to build your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <section.icon
                        className={`h-4 w-4 mr-3 ${
                          section.completed ? "text-green-600" : "text-gray-400"
                        }`}
                      />
                      <span className="flex-1 text-sm font-medium">
                        {section.name}
                      </span>
                      {section.completed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  ))}

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm text-gray-600">17%</span>
                    </div>
                    <Progress value={17} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import from LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Import Existing Resume
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Auto-Fill
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Section Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    {sections.find((s) => s.id === activeSection)?.icon &&
                      React.createElement(
                        sections.find((s) => s.id === activeSection).icon,
                        { className: "h-5 w-5" }
                      )}
                    {sections.find((s) => s.id === activeSection)?.name}
                  </CardTitle>
                  <CardDescription>
                    Fill in your information for this section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeSection === "personal" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <Input
                          value={resumeData.personal.name}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              personal: {
                                ...resumeData.personal,
                                name: e.target.value,
                              },
                            })
                          }
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            value={resumeData.personal.email}
                            onChange={(e) => setResumeData((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, email: e.target.value },
                            }))}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.phone}
                            onChange={(e) => setResumeData((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, phone: e.target.value },
                            }))}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.location}
                            onChange={(e) => setResumeData((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, location: e.target.value },
                            }))}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">
                          Website/Portfolio
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            value={resumeData.personal.website}
                            onChange={(e) => setResumeData((prev) => ({
                              ...prev,
                              personal: { ...prev.personal, website: e.target.value },
                            }))}
                            className="pl-10 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "summary" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Professional Summary
                        </label>
                        <textarea
                          placeholder="Write a compelling summary of your professional experience and goals..."
                          className="w-full h-32 p-3 border rounded-lg text-sm sm:text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={resumeData.summary}
                          onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                    </div>
                  )}

                  {activeSection === "experience" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Work Experience</h3>
                        <Button size="sm" className="text-xs sm:text-sm" onClick={() => openAddModal("experience")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(resumeData.experience || []).length === 0 && (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">
                              No work experience added yet. Click "Add Experience" to get started.
                            </p>
                          </div>
                        )}
                        {(resumeData.experience || []).map((exp, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{exp.title || "Title"} — {exp.company || "Company"}</div>
                                <div className="text-xs text-gray-500">{exp.start} — {exp.end}</div>
                                <div className="text-sm text-gray-700 mt-2">{exp.description}</div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setModal({ open: true, section: 'experience', editIndex: i }); setModalForm(exp); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteItem('experience', i)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "education" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Education</h3>
                        <Button size="sm" className="text-xs sm:text-sm" onClick={() => openAddModal("education")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(resumeData.education || []).length === 0 && (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">No education added yet. Click "Add Education" to get started.</p>
                          </div>
                        )}
                        {(resumeData.education || []).map((edu, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{edu.degree || "Degree"} — {edu.school || "School"}</div>
                                <div className="text-xs text-gray-500">{edu.start} — {edu.end}</div>
                                <div className="text-sm text-gray-700 mt-2">{edu.description}</div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setModal({ open: true, section: 'education', editIndex: i }); setModalForm(edu); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteItem('education', i)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "skills" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Skills</h3>
                        <Button size="sm" className="text-xs sm:text-sm" onClick={() => openAddModal("skills")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Skill
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(resumeData.skills || []).length === 0 && (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">No skills added yet. Click "Add Skill" to get started.</p>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {(resumeData.skills || []).map((s, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                              <div className="text-sm">{s.name}</div>
                              <div className="text-xs text-gray-500">{s.level}</div>
                              <Button size="xs" variant="ghost" onClick={() => { setModal({ open: true, section: 'skills', editIndex: i }); setModalForm(s); }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => deleteItem('skills', i)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "projects" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Projects</h3>
                        <Button size="sm" className="text-xs sm:text-sm" onClick={() => openAddModal("projects")}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Project
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {(resumeData.projects || []).length === 0 && (
                          <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">No projects added yet. Click "Add Project" to get started.</p>
                          </div>
                        )}
                        {(resumeData.projects || []).map((p, i) => (
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{p.name || "Project"}</div>
                                <div className="text-xs text-gray-500">{p.link}</div>
                                <div className="text-sm text-gray-700 mt-2">{p.description}</div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setModal({ open: true, section: 'projects', editIndex: i }); setModalForm(p); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => deleteItem('projects', i)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        
      </Tabs>

      {/* Action Bar */}
      <Card>
        <CardContent className="pt-6">
          {submitError && (
            <div className="mb-3 p-2 text-sm text-red-700 bg-red-100 rounded">
              {submitError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button className="flex-1 text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            <Button variant="outline" className="flex-1 text-sm sm:text-base">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              className="flex-1 text-sm sm:text-base bg-blue-600 text-white"
              onClick={submitResume}
              disabled={submitLoading}
            >
              {submitLoading ? 'Submitting...' : 'Submit Resume'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Modal Overlay */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeModal} />
          <div className="relative bg-white w-11/12 max-w-2xl rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">{modal.editIndex >= 0 ? 'Edit' : 'Add'} {modal.section}</h3>
              <Button size="sm" variant="ghost" onClick={closeModal}>Close</Button>
            </div>
            <div className="space-y-3">
              {modal.section === 'experience' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Job Title" value={modalForm.title || ''} onChange={(e) => setModalForm({...modalForm, title: e.target.value})} />
                  <Input placeholder="Company" value={modalForm.company || ''} onChange={(e) => setModalForm({...modalForm, company: e.target.value})} />
                  <Input placeholder="Start (e.g. 2020)" value={modalForm.start || ''} onChange={(e) => setModalForm({...modalForm, start: e.target.value})} />
                  <Input placeholder="End (e.g. 2022 or Present)" value={modalForm.end || ''} onChange={(e) => setModalForm({...modalForm, end: e.target.value})} />
                  <textarea className="col-span-1 sm:col-span-2 p-2 border rounded" placeholder="Description" value={modalForm.description || ''} onChange={(e) => setModalForm({...modalForm, description: e.target.value})} />
                </div>
              )}

              {modal.section === 'education' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="School" value={modalForm.school || ''} onChange={(e) => setModalForm({...modalForm, school: e.target.value})} />
                  <Input placeholder="Degree" value={modalForm.degree || ''} onChange={(e) => setModalForm({...modalForm, degree: e.target.value})} />
                  <Input placeholder="Start" value={modalForm.start || ''} onChange={(e) => setModalForm({...modalForm, start: e.target.value})} />
                  <Input placeholder="End" value={modalForm.end || ''} onChange={(e) => setModalForm({...modalForm, end: e.target.value})} />
                  <textarea className="col-span-1 sm:col-span-2 p-2 border rounded" placeholder="Description" value={modalForm.description || ''} onChange={(e) => setModalForm({...modalForm, description: e.target.value})} />
                </div>
              )}

              {modal.section === 'skills' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Skill name" value={modalForm.name || ''} onChange={(e) => setModalForm({...modalForm, name: e.target.value})} />
                  <Input placeholder="Level (e.g. Expert)" value={modalForm.level || ''} onChange={(e) => setModalForm({...modalForm, level: e.target.value})} />
                </div>
              )}

              {modal.section === 'projects' && (
                <div className="grid grid-cols-1 gap-2">
                  <Input placeholder="Project name" value={modalForm.name || ''} onChange={(e) => setModalForm({...modalForm, name: e.target.value})} />
                  <Input placeholder="Link" value={modalForm.link || ''} onChange={(e) => setModalForm({...modalForm, link: e.target.value})} />
                  <textarea className="p-2 border rounded" placeholder="Description" value={modalForm.description || ''} onChange={(e) => setModalForm({...modalForm, description: e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button onClick={saveModal}>{modal.editIndex >= 0 ? 'Save' : 'Add'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}