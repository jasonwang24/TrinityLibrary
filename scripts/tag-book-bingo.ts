import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BINGO_TAG_NAME = "Book Bingo";
const BINGO_TAG_COLOR = "#F59E0B";

const bingoTitles: string[] = [
  "12 Ways Your Phone Is Changing You",
  "Beyond Racial Gridlock",
  "Crazy Busy",
  "What Does the Bible Really Teach about Homosexuality?",
  "Work",
  "You're Only Human",

  "Christ-Centered Worship",
  "Liturgical Theology",
  "Worship by the Book",
  "Worship Matters",

  "Confronting Christianity",
  "Evidence That Demands a Verdict",
  "Marks of the Messenger",
  "Mere Christianity",
  "The Reason for God",
  "Seeking Allah, Finding Jesus",
  "The Universe Next Door",
  "What Is the Gospel?",

  "Bible Doctrine",
  "Systematic Theology",
  "Daily Doctrine",
  "Everyone's a Theologian",
  "Knowing God",
  "The Wonderful Works of God",

  "50 Crucial Questions",
  "enGendered",
  "Eve in Exile",
  "God's Design for Man and Woman",
  "Let Me Be A Woman",
  "Women in the Church",

  "Augustine of Hippo",
  "Calvin",
  "C.S. Lewis—A Life",
  "George Müller",
  "George Whitefield",
  "The Hiding Place",
  "Jonathan Edwards: A Life",
  "Nine Day Queen of England: Lady Jane Grey",

  "The Doctrine of the Word of God",
  "Hermeneutics, Authority, and Canon",
  "The New Testament Documents",
  "The Old Testament Documents",
  "Taking God At His Word",

  "Crime and Punishment",
  "Gilead",
  "Great Expectations",
  "The Hammer of God",
  "Hannah Coulter",
  "Jane Eyre",
  "Les Misérables",
  "The Lord of the Rings",

  "Christian Ethics",
  "Evangelical Ethics",
  "Principles of Conduct",
  "Resurrection and Moral Order",
  "The Ten Commandments",

  "The Cross-Centered Life",
  "The Cross of Christ",
  "The Discipline of Grace",
  "A Gospel Primer for Christians",
  "Saved by Grace",

  "Four Quartets",
  "Tenebrae",
  "Holy Sonnets",
  "Noble Numbers",

  "According to Plan",
  "Dig Deeper",
  "Invitation to Biblical Interpretation",
  "Knowing Scripture",

  "Child Proof",
  "The Duties of Parents",
  "The Family Life of a Christian Leader",
  "Safeguards",
  "Shepherding a Child's Heart",

  "Love that Lasts",
  "God, Marriage, and Family",
  "The Meaning of Marriage",
  "Not Yet Married",
  "Seven Myths About Singleness",

  "2,000 Years of Christ's Power",
  "History of Theology",
  "Turning Points",
  "The Unquenchable Flame",

  "Biblical Critical Theory",
  "Gentle and Lowly",
  "Impossible Christianity",
  "The Path to Being a Pastor",
  "Rise and Triumph of the Modern Self",

  "Holiness",
  "Institutes of the Christian Religion",
  "Overcoming Sin and Temptation",
  "Redemption: Accomplished and Applied",
  "Seeing and Savoring Jesus Christ",

  "To the Golden Shore",
  "God's Smuggler",
  "The Insanity of God",
  "John G. Paton",
  "Let the Nations Be Glad",
  "Mission Affirmed",
  "Missions by the Book",

  "Caring for One Another",
  "Discipling",
  "Discipling in a Multicultural World",
  "Instruments in the Redeemer's Hand",
  "The Trellis and the Vine",

  "Blame It on the Brain",
  "Dark Clouds, Deep Mercy",
  "Depression",
  "Good and Angry",
  "Running Scared",
  "Spiritual Depression",
  "Untangling Emotions",
  "When People Are Big and God Is Small",

  "Family Worship",
  "Habits of Grace",
  "A Praying Life",
  "Praying the Bible",
  "Spiritual Disciplines for the Christian Life",

  "The Bruised Reed",
  "The Pilgrim's Progress",
  "Precious Remedies Against Satan's Devices",
  "The Rare Jewel of Christian Contentment",
  "The Reformed Pastor",
  "The Religious Affections",

  "The City of God",
  "Confessions",
  "Letter to Diognetus",
  "The Life of Macrina",
  "On the Incarnation",
];

const nineMarksTopics = [
  "Biblical Theology",
  "Church Discipline",
  "Church Elders",
  "Church Membership",
  "Conversion",
  "Corporate Worship",
  "Deacons",
  "Discipling",
  "Evangelism",
  "Preaching",
  "The Gospel",
  "Prayer",
  "Missions",
  "Sound Doctrine",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "APPLY mode — writing changes" : "DRY RUN — pass --apply to write");

  const tag = apply
    ? await prisma.tag.upsert({
        where: { name: BINGO_TAG_NAME },
        create: { name: BINGO_TAG_NAME, color: BINGO_TAG_COLOR },
        update: {},
      })
    : await prisma.tag.findUnique({ where: { name: BINGO_TAG_NAME } }) ?? {
        id: "<would-create>",
        name: BINGO_TAG_NAME,
      };
  console.log(`Tag: ${tag.name} (${tag.id})\n`);

  const allResources = await prisma.resource.findMany({
    select: { id: true, title: true, author: true, publisher: true, tags: { select: { tagId: true } } },
  });

  const byNormTitle = new Map<string, typeof allResources>();
  for (const r of allResources) {
    const k = normalize(r.title);
    const list = byNormTitle.get(k) ?? [];
    list.push(r);
    byNormTitle.set(k, list);
  }

  const matched: { title: string; resourceId: string; resourceTitle: string; alreadyTagged: boolean }[] = [];
  const unmatched: string[] = [];

  for (const title of bingoTitles) {
    const candidates = byNormTitle.get(normalize(title));
    if (!candidates || candidates.length === 0) {
      unmatched.push(title);
      continue;
    }
    for (const r of candidates) {
      matched.push({
        title,
        resourceId: r.id,
        resourceTitle: r.title,
        alreadyTagged: r.tags.some((t) => t.tagId === tag.id),
      });
    }
  }

  const nineMarksMatched: { topic: string; resourceId: string; resourceTitle: string; alreadyTagged: boolean }[] = [];
  const nineMarksUnmatched: string[] = [];

  for (const topic of nineMarksTopics) {
    const topicNorm = normalize(topic);
    const hits = allResources.filter((r) => {
      const titleNorm = normalize(r.title);
      const publisherNorm = normalize(r.publisher ?? "");
      const is9Marks =
        titleNorm.includes("9marks") ||
        titleNorm.includes("nine marks") ||
        publisherNorm.includes("9marks") ||
        publisherNorm.includes("nine marks");
      return is9Marks && titleNorm.includes(topicNorm);
    });
    if (hits.length === 0) {
      nineMarksUnmatched.push(topic);
      continue;
    }
    for (const r of hits) {
      nineMarksMatched.push({
        topic,
        resourceId: r.id,
        resourceTitle: r.title,
        alreadyTagged: r.tags.some((t) => t.tagId === tag.id),
      });
    }
  }

  console.log(`=== Bingo title matches: ${matched.length} ===`);
  for (const m of matched) {
    console.log(`  ${m.alreadyTagged ? "[tagged]" : "[to tag]"} "${m.resourceTitle}" ← "${m.title}"`);
  }

  console.log(`\n=== 9Marks matches: ${nineMarksMatched.length} ===`);
  for (const m of nineMarksMatched) {
    console.log(`  ${m.alreadyTagged ? "[tagged]" : "[to tag]"} "${m.resourceTitle}" ← topic "${m.topic}"`);
  }

  console.log(`\n=== Unmatched bingo titles (${unmatched.length}) ===`);
  for (const u of unmatched) console.log(`  - ${u}`);

  console.log(`\n=== Unmatched 9Marks topics (${nineMarksUnmatched.length}) ===`);
  for (const u of nineMarksUnmatched) console.log(`  - ${u}`);

  if (apply) {
    const toTag = [...matched, ...nineMarksMatched].filter((m) => !m.alreadyTagged);
    if (toTag.length === 0) {
      console.log("\nNothing to write.");
    } else {
      await prisma.resourceTag.createMany({
        data: toTag.map((m) => ({ resourceId: m.resourceId, tagId: tag.id })),
        skipDuplicates: true,
      });
      console.log(`\nWrote ${toTag.length} tag links.`);
    }
  } else {
    const newLinks = [...matched, ...nineMarksMatched].filter((m) => !m.alreadyTagged).length;
    console.log(`\nWould create ${newLinks} new tag links. Re-run with --apply.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
