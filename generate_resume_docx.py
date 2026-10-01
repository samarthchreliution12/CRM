import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def create_resume():
    doc = docx.Document()

    # Set standard professional page margins (0.6 in)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.55)
        section.bottom_margin = Inches(0.55)
        section.left_margin = Inches(0.65)
        section.right_margin = Inches(0.65)

    # Color Palette
    COLOR_PRIMARY = RGBColor(15, 23, 42)     # #0F172A Deep Navy / Slate
    COLOR_SECONDARY = RGBColor(51, 65, 85)   # #334155 Slate
    COLOR_TEXT = RGBColor(30, 41, 59)        # #1E293B Body Text
    COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B Subtle Gray
    COLOR_ACCENT = RGBColor(37, 99, 235)     # #2563EB Link Blue

    # Set normal style font
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = COLOR_TEXT

    def add_section_header(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True

        run = p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(11.5)
        run.font.color.rgb = COLOR_PRIMARY

        # Add horizontal bottom border in XML
        pPr = p._element.get_or_add_pPr()
        pBdr = parse_xml(r'<w:pBdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                         r'<w:bottom w:val="single" w:sz="8" w:space="2" w:color="CBD5E1"/>'
                         r'</w:pBdr>')
        pPr.append(pBdr)

    def add_bullet_point(p_or_text, bold_prefix="", text=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2.5)
        p.paragraph_format.line_spacing = 1.12
        p.paragraph_format.left_indent = Inches(0.25)
        
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.bold = True
            r_bold.font.color.rgb = COLOR_PRIMARY
            r_bold.font.size = Pt(9.8)

        if text:
            r_text = p.add_run(text)
            r_text.font.color.rgb = COLOR_TEXT
            r_text.font.size = Pt(9.8)
        return p

    def add_role_row(title, organization, date_location):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True

        r1 = p.add_run(title)
        r1.bold = True
        r1.font.size = Pt(10.5)
        r1.font.color.rgb = COLOR_PRIMARY

        if organization:
            r2 = p.add_run(f" | {organization}")
            r2.bold = True
            r2.font.size = Pt(10.2)
            r2.font.color.rgb = COLOR_SECONDARY

        if date_location:
            # We can format using tabs or right align
            r3 = p.add_run(f"   ({date_location})")
            r3.italic = True
            r3.font.size = Pt(9.5)
            r3.font.color.rgb = COLOR_MUTED

    # =========================================================================
    # HEADER (NAME & CONTACT INFO)
    # =========================================================================
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header.paragraph_format.space_before = Pt(0)
    p_header.paragraph_format.space_after = Pt(2)

    run_name = p_header.add_run("SAMARTH CHAVDA")
    run_name.bold = True
    run_name.font.size = Pt(22)
    run_name.font.color.rgb = COLOR_PRIMARY

    p_contact = doc.add_paragraph()
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_contact.paragraph_format.space_before = Pt(0)
    p_contact.paragraph_format.space_after = Pt(6)

    def add_contact_item(p, text, is_link=False, separator=True):
        r = p.add_run(text)
        r.font.size = Pt(9.5)
        if is_link:
            r.font.color.rgb = COLOR_ACCENT
            r.underline = False
        else:
            r.font.color.rgb = COLOR_SECONDARY
        
        if separator:
            sep = p.add_run("   |   ")
            sep.font.size = Pt(9.5)
            sep.font.color.rgb = COLOR_MUTED

    add_contact_item(p_contact, "✉  chavdasamarth007@gmail.com")
    add_contact_item(p_contact, "☏  +91-8128420287")
    add_contact_item(p_contact, "LinkedIn", is_link=True)
    add_contact_item(p_contact, "GitHub", is_link=True)
    add_contact_item(p_contact, "Portfolio", is_link=True, separator=False)

    # =========================================================================
    # PROFILE SUMMARY
    # =========================================================================
    add_section_header("Profile Summary")
    p_summary = doc.add_paragraph()
    p_summary.paragraph_format.space_before = Pt(2)
    p_summary.paragraph_format.space_after = Pt(4)
    p_summary.paragraph_format.line_spacing = 1.15

    r_sum = p_summary.add_run(
        "Software Developer specializing in Odoo 19 and full-stack web development, currently completing a Computer Engineering "
        "degree. Hands-on experience building AI-integrated, production-deployed applications including CodeCampus AI (Gemini API, "
        "FastAPI, PostgreSQL), an AI WhatsApp Business Automation platform (OpenAI GPT-4o-mini, WhatsApp Business API, Docker), "
        "and a specialized Financial & Stock Market Advisory CRM with Client Portal. Actively working as an Odoo 19 Python Developer "
        "at Relution Company — developing modules, customizing ERP workflows, and implementing business logic using the Odoo ORM "
        "framework. Strong proficiency in Python, TypeScript, React, and REST API development."
    )
    r_sum.font.size = Pt(9.8)

    # =========================================================================
    # EXPERIENCE
    # =========================================================================
    add_section_header("Experience")

    add_role_row("Full-Stack & Odoo Software Developer Intern", "Reliution Company Pvt. Ltd. – Rajkot, India", "April 2026 – Present")
    
    add_bullet_point(
        doc,
        "Full-Stack CRM Architecture: ",
        "Architected and developed a full-stack CRM and Client Portal using React, Node.js (Express), and PostgreSQL, streamlining lead tracking, service requests, and client onboarding workflows."
    )
    add_bullet_point(
        doc,
        "Enterprise Document Vault & Security: ",
        "Built an enterprise-grade document vault with multi-factor authentication (TOTP/MFA), granular RBAC, and audit logging to securely store, verify, and manage confidential client files."
    )
    add_bullet_point(
        doc,
        "WhatsApp Cloud API Automation: ",
        "Integrated WhatsApp Business API automated messaging pipelines for real-time customer outreach, templated notifications, and birthday/event communications."
    )
    add_bullet_point(
        doc,
        "Modular Odoo ERP Engineering: ",
        "Engineered custom modular ERP components within Odoo 19 using Python to adapt CRM pipelines and Sales workflows to business operations."
    )
    add_bullet_point(
        doc,
        "Performance & Deployment Optimization: ",
        "Optimized deployment workflows with SSG pre-rendering, implemented rate limiting and Helmet security headers, and resolved dependency bottlenecks across release test cycles."
    )

    # =========================================================================
    # MAJOR PROJECTS
    # =========================================================================
    add_section_header("Major Projects")

    # --- PROJECT 1: STOCK MARKET CRM (NEW FOCUS) ---
    p_p1 = doc.add_paragraph()
    p_p1.paragraph_format.space_before = Pt(4)
    p_p1.paragraph_format.space_after = Pt(2)
    p_p1.paragraph_format.keep_with_next = True

    r_p1_title = p_p1.add_run("Stock Market & Wealth Advisory CRM with Client Portal")
    r_p1_title.bold = True
    r_p1_title.font.size = Pt(10.5)
    r_p1_title.font.color.rgb = COLOR_PRIMARY

    r_p1_links = p_p1.add_run("   |   GitHub   |   Live Demo")
    r_p1_links.font.size = Pt(9.5)
    r_p1_links.font.color.rgb = COLOR_ACCENT

    # Tech stack subtitle
    p_p1_tech = doc.add_paragraph()
    p_p1_tech.paragraph_format.space_before = Pt(0)
    p_p1_tech.paragraph_format.space_after = Pt(2)
    r_p1_tech = p_p1_tech.add_run("Tech Stack: React.js, Node.js (Express), PostgreSQL, REST APIs, ChatterPillar WhatsApp API, AES-256")
    r_p1_tech.italic = True
    r_p1_tech.font.size = Pt(9.2)
    r_p1_tech.font.color.rgb = COLOR_MUTED

    add_bullet_point(
        doc,
        "Stock Market & Financial Advisory Domain: ",
        "Architected an enterprise-ready financial CRM designed for stock market advisory operations, supporting Equity, Demat Accounts, Mutual Funds, IPOs, PMS, and Unique Client Code (UCC) investor management."
    )
    add_bullet_point(
        doc,
        "Physical Share Demat & IEPF Recovery Engine: ",
        "Built specialized workflows handling physical paper share certificate dematerialization, RTA signature mismatch resolutions, duplicate share issuance, and IEPF (Investor Education and Protection Fund) unclaimed share/dividend recovery."
    )
    add_bullet_point(
        doc,
        "Client Portal & Encrypted Document Vault: ",
        "Engineered an isolated self-service client portal for retail investors to securely submit regulatory documents (PAN, Aadhaar, Specimen Signature, Bank Proof) with server-side AES-256 encryption and IDOR defense."
    )
    add_bullet_point(
        doc,
        "ChatterPillar WhatsApp Integration: ",
        "Connected ChatterPillar WhatsApp Cloud API for official template synchronization, dynamic variable substitution, and personalized birthday greeting workflows without background schedulers."
    )
    add_bullet_point(
        doc,
        "Security & Regulatory Compliance: ",
        "Implemented fine-grained RBAC permission matrix, TOTP MFA, rate limiting, and automated notification audit trails tailored for financial advisory standards."
    )

    # --- PROJECT 2: AI WHATSAPP AUTOMATION ---
    p_p2 = doc.add_paragraph()
    p_p2.paragraph_format.space_before = Pt(4)
    p_p2.paragraph_format.space_after = Pt(2)
    p_p2.paragraph_format.keep_with_next = True

    r_p2_title = p_p2.add_run("AI WhatsApp Business Automation")
    r_p2_title.bold = True
    r_p2_title.font.size = Pt(10.5)
    r_p2_title.font.color.rgb = COLOR_PRIMARY

    r_p2_links = p_p2.add_run("   |   GitHub   |   Live")
    r_p2_links.font.size = Pt(9.5)
    r_p2_links.font.color.rgb = COLOR_ACCENT

    add_bullet_point(
        doc,
        "",
        "Engineered a production-ready, full-stack business automation platform by integrating OpenAI GPT-4o-mini with the WhatsApp Business API, enabling 24/7 intelligent customer support with context-aware automated responses."
    )
    add_bullet_point(
        doc,
        "",
        "Architected a scalable FastAPI backend with RESTful API design, real-time webhook processing, and a modular service layer cleanly separating AI inference, chatbot logic, and core business operations."
    )
    add_bullet_point(
        doc,
        "",
        "Designed a normalized PostgreSQL schema using SQLAlchemy ORM with optimized indexing to support multi-tenant client, lead, and conversation data at scale; containerized the full application stack using Docker."
    )
    add_bullet_point(
        doc,
        "",
        "Delivered a responsive React 19 frontend (Tailwind CSS, Axios) with dedicated modules for Dashboard Analytics, Lead Management, Client Management, and real-time Chat — providing businesses with complete visibility into customer interactions."
    )

    # --- PROJECT 3: STUDYPOINT ---
    p_p3 = doc.add_paragraph()
    p_p3.paragraph_format.space_before = Pt(4)
    p_p3.paragraph_format.space_after = Pt(2)
    p_p3.paragraph_format.keep_with_next = True

    r_p3_title = p_p3.add_run("StudyPoint")
    r_p3_title.bold = True
    r_p3_title.font.size = Pt(10.5)
    r_p3_title.font.color.rgb = COLOR_PRIMARY

    r_p3_links = p_p3.add_run("   |   GitHub   |   Live Demo")
    r_p3_links.font.size = Pt(9.5)
    r_p3_links.font.color.rgb = COLOR_ACCENT

    add_bullet_point(
        doc,
        "",
        "MERN-based study platform with secure login, role-based access control, and admin dashboard for organized content management for students and educators."
    )
    add_bullet_point(
        doc,
        "",
        "Supports course uploads, student management, and interactive UI with a clean, structured learning experience."
    )

    # --- PROJECT 4: ONLINE DOCUMENT REPOSITORY ---
    p_p4 = doc.add_paragraph()
    p_p4.paragraph_format.space_before = Pt(4)
    p_p4.paragraph_format.space_after = Pt(2)
    p_p4.paragraph_format.keep_with_next = True

    r_p4_title = p_p4.add_run("Online Document Repository")
    r_p4_title.bold = True
    r_p4_title.font.size = Pt(10.5)
    r_p4_title.font.color.rgb = COLOR_PRIMARY

    r_p4_links = p_p4.add_run("   |   GitHub")
    r_p4_links.font.size = Pt(9.5)
    r_p4_links.font.color.rgb = COLOR_ACCENT

    add_bullet_point(
        doc,
        "",
        "MERN application enabling document sharing between faculty and students with task assignment, file uploads, multi-level approval workflow, and real-time notifications."
    )

    # =========================================================================
    # TECHNICAL SKILLS
    # =========================================================================
    add_section_header("Technical Skills")

    skills_data = [
        ("Languages", "JavaScript, Python, Java, HTML, CSS"),
        ("Frameworks", "React.js, Node.js, Express.js, FastAPI"),
        ("AI & APIs", "OpenAI GPT API, Google Gemini API, WhatsApp Business API (ChatterPillar), REST APIs"),
        ("ERP / Odoo", "Odoo 19 — Module Development, ORM, CRM, Sales, ERP Workflows"),
        ("Databases", "PostgreSQL, MongoDB, MySQL"),
        ("DevOps & Tools", "Git, GitHub, Docker, VS Code, Vercel, Render"),
    ]

    for label, items in skills_data:
        p_sk = doc.add_paragraph()
        p_sk.paragraph_format.space_before = Pt(1)
        p_sk.paragraph_format.space_after = Pt(1.5)
        p_sk.paragraph_format.line_spacing = 1.1

        r_lbl = p_sk.add_run(f"{label}: ")
        r_lbl.bold = True
        r_lbl.font.size = Pt(9.8)
        r_lbl.font.color.rgb = COLOR_PRIMARY

        r_itm = p_sk.add_run(items)
        r_itm.font.size = Pt(9.8)
        r_itm.font.color.rgb = COLOR_TEXT

    # =========================================================================
    # EDUCATION
    # =========================================================================
    add_section_header("Education")

    add_role_row("Marwadi University, Rajkot", "B.Tech in Computer Engineering", "2022 – June 2026")
    
    p_edu = doc.add_paragraph()
    p_edu.paragraph_format.space_before = Pt(0)
    p_edu.paragraph_format.space_after = Pt(2)
    r_cgpa = p_edu.add_run("CGPA: 6.52 / 10\n")
    r_cgpa.bold = True
    r_cgpa.font.size = Pt(9.5)
    r_cgpa.font.color.rgb = COLOR_SECONDARY

    r_courses = p_edu.add_run("Relevant Courses: Artificial Intelligence · Machine Learning · DBMS · Operating Systems · Web Technology · OOP (Java)")
    r_courses.font.size = Pt(9.2)
    r_courses.font.color.rgb = COLOR_MUTED

    # Output paths
    output_path = "/Users/chavdasamarth/Desktop/CRM-Project/Samarth_Chavda_Resume.docx"
    doc.save(output_path)
    print(f"Resume saved successfully to: {output_path}")

    # Also save to Desktop for easy access
    desktop_path = "/Users/chavdasamarth/Desktop/Samarth_Chavda_Resume.docx"
    try:
        doc.save(desktop_path)
        print(f"Resume also saved to Desktop: {desktop_path}")
    except Exception as e:
        print(f"Note: Could not copy to Desktop: {e}")

if __name__ == "__main__":
    create_resume()
