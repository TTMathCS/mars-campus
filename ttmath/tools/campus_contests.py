"""TTMath's math contests, Sept to Dec 2026: the second screen in the Gate Hall.

From TTMath's "2026 Sept-Dec Math Contest" sheet, the picture Jim sent on 6 Oct 2026 ("2 big screens, one is for
schedule, one is for below contest"; then "compress all schedule within one screen, leaving second screen as contest
above"), row for row as printed. On the campus the individual contests are written in Ramanujan (T06-12, room 139), the
competition room downstairs, instead of the school's site on Earth.

campus_buildings.py writes it into the demo's data (P2.contests) for the screen and onto plan/contests.html.
usage: python3 ttmath/tools/campus_contests.py   (prints the sheet)
"""

TITLE = "2026 Sept–Dec Math Contest"
VENUE = "Individual contests are written at the campus: Ramanujan, room 139, the competition room downstairs"
CONTACT = ("Tel 647-499-8880", "Tel 905-604-9339", "info@ttmath.ca")
COLUMNS = ("Contest · date · time", "Contest info", "School gr.", "TTmath best level", "Price TTmath", "Price non-TTmath",
           "Early deadline", "Deadline", "Registration")

# the individual contests: who sets it, its name, when, a note if any, the contest's form (three lines), the school
# grades, the best TTmath level, the two prices, the early deadline and the deadline, where to register
CONTESTS = [
    dict(org="CMS", name="Canada Lynx", when="Thursday, Oct. 1st @ 5PM or 7PM", info=("Multiple choices", "15 questions", "1.5 hr"),
         grades=("Gr7/8", "Gr9/10", "Gr11/12"), level=("L1 completed", "L2 completed", "L3 completed"), price=("$20", "$30"), early="FULL", deadline="FULL"),
    dict(org="CMS", name="COMC", when="Thursday, Oct. 29th @ 1:30PM", info=("Work shown", "12 questions", "2.5 hr"),
         grades=("Gr9–12",), level=("L4 completed", "(try after L3 completed)"), price=("$40", "$50"), early="Sept 29", deadline="Oct. 15"),
    dict(org="CMS", name="Canada Jay", when="Thursday, Nov. 19th @ 5PM or 7PM", info=("Multiple choices", "15 questions", "1.5 hr"),
         grades=("Gr5/6", "Gr7/8"), level=("L1 completed", "L2 completed"), price=("$20", "$30"), early="Sept 29", deadline="Oct. 15"),
    dict(org="MAA", name="AMC10/12A", when="Thursday, Nov. 5th @ 5PM or 7PM", info=("Multiple choices", "25 questions", "75 minutes"),
         grades=("Gr9/10", "Gr11/12"), level=("L3 completed for AMC10", "L4 completed for AMC12"), price=("$30", "$50"), early="Sept 29", deadline="Oct. 20"),
    dict(org="MAA", name="AMC10/12B", when="Friday, Nov. 13th @ 5PM or 7PM", info=("Multiple choices", "25 questions", "75 minutes"),
         grades=("Gr9/10", "Gr11/12"), level=("L3 completed for AMC10", "L4 completed for AMC12"), price=("$30", "$50"), early="Sept 29", deadline="Oct. 20"),
    dict(org="", name="Beaver Computing Challenge", note="Bring your laptop", when="Sunday, Nov. 15 @ 5PM or 7:30PM", info=("Multiple choices", "12–15 questions", "45 minutes"),
         grades=("Grade 5/6", "Grade 7/8", "Grade 9/10"), level=("Gr10 and under",), price=("$15", "$30"), early="Sept 29", deadline="Oct. 20"),
    dict(org="Waterloo", name="Canadian Intermediate (CIMC)", when="Wednesday, Nov. 18 @ 6:45PM", info=("Answer and solution", "9 questions", "2 hr"),
         grades=("Gr9/10",), level=("L3 completed",), price=("$25", "$40"), early="Sept 29", deadline="Oct. 20"),
    dict(org="MAA", name="AMC8", when="Sunday, Jan. 24th, 2027 @ 5PM or 7:30PM", info=("Multiple choices", "25 questions", "40 minutes"),
         grades=("Gr8 & under",), level=("L2 completed",), price=("$20", "$40"), early="Sept 29", deadline="Dec. 20"),
]
REGISTER = ("Your day school", "or TTmath")
# for the screen (v0.21): each contest's date (ISO; a range's end as printed), its time, and a short form of its name
# and its form, so the cards can be set in large type
SCREEN = {
    "Canada Lynx": dict(iso="2026-10-01", at="5 PM or 7 PM", short="Canada Lynx", form="15 multiple-choice questions, 1.5 hr"),
    "COMC": dict(iso="2026-10-29", at="1:30 PM", short="COMC", form="12 questions, work shown, 2.5 hr"),
    "Canada Jay": dict(iso="2026-11-19", at="5 PM or 7 PM", short="Canada Jay", form="15 multiple-choice questions, 1.5 hr"),
    "AMC10/12A": dict(iso="2026-11-05", at="5 PM or 7 PM", short="AMC 10/12 A", form="25 multiple-choice questions, 75 min"),
    "AMC10/12B": dict(iso="2026-11-13", at="5 PM or 7 PM", short="AMC 10/12 B", form="25 multiple-choice questions, 75 min"),
    "Beaver Computing Challenge": dict(iso="2026-11-15", at="5 PM or 7:30 PM", short="Beaver Computing Challenge", form="12–15 multiple-choice questions, 45 min"),
    "Canadian Intermediate (CIMC)": dict(iso="2026-11-18", at="6:45 PM", short="Canadian Intermediate (CIMC)", form="9 questions, answers and solutions, 2 hr"),
    "AMC8": dict(iso="2027-01-24", at="5 PM or 7:30 PM", short="AMC 8", form="25 multiple-choice questions, 40 min"),
    "HMMT Team Contest": dict(iso="2026-11-07", at="", short="HMMT", form="Team contest"),
    "HiMCM Team Contest": dict(iso="2026-11-04", until="Nov 17", at="", short="HiMCM", form="Team modelling contest, over two weeks"),
    "ACSL Team Contest": dict(iso="2026-10-19", until="May 23", at="", short="ACSL", form="Team computer science contest, all year"),
}
# the team contests, TTmath students only
TEAMS = [
    dict(name="HMMT Team Contest", when="Nov. 7, 2026", grades="Gr7 and above", level="L5 and MO class", price="TBD"),
    dict(name="HiMCM Team Contest", when="Nov. 4–17, 2026", grades="Gr7 and above", level="TTmath Modeling (free)", price="N/A"),
    dict(name="ACSL Team Contest", when="Oct. 19 – May 23", grades="All students", level="CS1/2/3/4 (free)", price="N/A"),
]
# the notes under the table, as printed; the colour each is printed in
NOTES_HEAD = "Please read carefully before your payment:"
NOTES = [
    ("E-transfer: payment@ttmath.ca. Please include the student's name / TT student ID / day school grade / your contact email / contest name, or pay at our school site", "maroon"),
    ("Please check the early registration date: the price goes up $10 after the early date for all students", "blue"),
    ("Including all contest sites and grades, in each frame you can only do one contest in the school year", "red"),
    ("No refund or credit for any contest cancellation; please always check with your home school first", "red"),
    ("The contest fee is waived for the corresponding contest if you were a CMS national winner, AMC top 1%, or had a perfect score or Group 1 in any contest last school year", "red"),
    ("TT Math School reserves the final right of explanation for the rules above", "ink"),
    ("First come, first served: each contest has limited spots", "blue"),
]


def data():
    """the sheet for the demo (P2.contests)"""
    return dict(title=TITLE, venue=VENUE, contact=list(CONTACT), columns=list(COLUMNS), register=list(REGISTER),
                contests=[dict(c, info=list(c["info"]), grades=list(c["grades"]), level=list(c["level"]), price=list(c["price"]), note=c.get("note", ""), screen=SCREEN[c["name"]]) for c in CONTESTS],
                teams=[dict(t, screen=SCREEN[t["name"]]) for t in TEAMS], notes_head=NOTES_HEAD, notes=[list(n) for n in NOTES])


if __name__ == "__main__":
    print(TITLE); print(VENUE)
    for c in CONTESTS:
        print("%-10s %-30s %-40s %-22s %s/%s  early %-8s deadline %s" % (c["org"], c["name"], c["when"], " ".join(c["grades"]), c["price"][0], c["price"][1], c["early"], c["deadline"]))
    for t in TEAMS: print("team      %-30s %-20s %-14s %s" % (t["name"], t["when"], t["grades"], t["level"]))
    print(NOTES_HEAD)
    for n, col in NOTES: print(" -", n)
