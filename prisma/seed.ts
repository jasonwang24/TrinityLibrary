import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const tagDefinitions = [
  { name: "Apologetics", color: "#DC2626" },
  { name: "Biographies", color: "#EA580C" },
  { name: "Bibles", color: "#854D0E" },
  { name: "Biblical Studies", color: "#CA8A04" },
  { name: "Care & Counseling", color: "#65A30D" },
  { name: "Children's Books", color: "#F472B6" },
  { name: "Christian Classics", color: "#7C3AED" },
  { name: "Church History", color: "#A16207" },
  { name: "Cultural Issues", color: "#0891B2" },
  { name: "Christian Living", color: "#2563EB" },
  { name: "Commentaries", color: "#4F46E5" },
  { name: "Community", color: "#059669" },
  { name: "Devotionals", color: "#D97706" },
  { name: "Ethnic Harmony", color: "#9333EA" },
  { name: "Evangelism & Missions", color: "#E11D48" },
  { name: "Holy Spirit", color: "#0EA5E9" },
  { name: "Leadership & Pastoral Ministry", color: "#475569" },
  { name: "Marriage", color: "#DB2777" },
  { name: "Men & Women", color: "#7C3AED" },
  { name: "Parenting", color: "#16A34A" },
  { name: "Spiritual Disciplines", color: "#0D9488" },
  { name: "Sovereign Grace", color: "#6D28D9" },
  { name: "The Church", color: "#1D4ED8" },
  { name: "Theology", color: "#374151" },
];

const books: { title: string; author: string; copies: number; shelf: string; tags: string[] }[] = [
  { title: "21 Servants of Sovereign Joy", author: "John Piper", copies: 1, shelf: "3", tags: ["Biographies"] },
  { title: "7 Myths about Singleness", author: "Sam Allberry", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "A Camaraderie of Confidence", author: "John Piper", copies: 1, shelf: "2", tags: ["Biographies"] },
  { title: "A Holy Ambition", author: "John Piper", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "A Pearl Necklace", author: "Mi Xue", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Ask Pastor John", author: "Tony Reinke", copies: 1, shelf: "2", tags: ["Christian Living"] },
  { title: "Astonished By God", author: "John Piper", copies: 1, shelf: "1", tags: ["Devotionals"] },
  { title: "Bible Promises for You", author: "Various", copies: 1, shelf: "5", tags: ["Devotionals"] },
  { title: "Black & Reformed", author: "Anthony J. Carter", copies: 1, shelf: "5", tags: ["Ethnic Harmony", "Theology"] },
  { title: "Brave and Bold", author: "Marty Machowski", copies: 1, shelf: "1", tags: ["Children's Books"] },
  { title: "Can We Trust the Gospels?", author: "Peter J. Williams", copies: 1, shelf: "3", tags: ["Apologetics", "Biblical Studies"] },
  { title: "Caring for One Another", author: "Edward T. Welch", copies: 2, shelf: "1", tags: ["Care & Counseling", "Community"] },
  { title: "Christ Alone", author: "Stephen Wellum", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Christian Apologetics", author: "Cornelius Van Til", copies: 1, shelf: "4", tags: ["Apologetics"] },
  { title: "Christian Beliefs", author: "Wayne Grudem", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Church Discipline (9Marks)", author: "Jonathan Leeman", copies: 1, shelf: "2", tags: ["The Church"] },
  { title: "Church Elders (9Marks)", author: "Jeramie Rinne", copies: 1, shelf: "2", tags: ["Leadership & Pastoral Ministry", "The Church"] },
  { title: "Church Membership (9Marks)", author: "Jonathan Leeman", copies: 1, shelf: "2", tags: ["The Church"] },
  { title: "Community", author: "Brad House", copies: 1, shelf: "4", tags: ["Community", "The Church"] },
  { title: "Competing Spectacles: Treasuring Christ in the Media Age", author: "Tony Reinke", copies: 1, shelf: "1", tags: ["Cultural Issues"] },
  { title: "Concise Theology", author: "J.I. Packer", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Conversion (9Marks)", author: "Michael Lawrence", copies: 2, shelf: "2", tags: ["Theology", "The Church"] },
  { title: "Crazy Love", author: "Francis Chan", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Deacons (9Marks)", author: "Matt Smethurst", copies: 1, shelf: "2", tags: ["Leadership & Pastoral Ministry", "The Church"] },
  { title: "Deeper", author: "Dane Ortlund", copies: 1, shelf: "4", tags: ["Spiritual Disciplines"] },
  { title: "Descriptions and Prescriptions", author: "Michael R. Emlet", copies: 1, shelf: "1", tags: ["Care & Counseling"] },
  { title: "Desiring God", author: "John Piper", copies: 2, shelf: "2", tags: ["Christian Living", "Theology"] },
  { title: "Disciplines of a Godly Man", author: "R. Kent Hughes", copies: 1, shelf: "4", tags: ["Spiritual Disciplines", "Men & Women"] },
  { title: "Disciplines of the Beautiful Woman", author: "Anne Ortlund", copies: 1, shelf: "1", tags: ["Spiritual Disciplines", "Men & Women"] },
  { title: "Eerdman's Handbook to the World's Religions", author: "Various", copies: 1, shelf: "2", tags: ["Apologetics"] },
  { title: "Essentials of Reformed Systematic Theology", author: "Beeke & Smalley", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Evangelism (9Marks)", author: "J. Mack Stiles", copies: 1, shelf: "2", tags: ["Evangelism & Missions"] },
  { title: "Every Good Endeavor", author: "Timothy Keller", copies: 1, shelf: "2", tags: ["Christian Living"] },
  { title: "Expositional Preaching (9Marks)", author: "David Helm", copies: 1, shelf: "2", tags: ["Leadership & Pastoral Ministry"] },
  { title: "Expository Exultation", author: "John Piper", copies: 1, shelf: "2", tags: ["Leadership & Pastoral Ministry"] },
  { title: "Faith Alone", author: "Thomas Schreiner", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Faithful Leaders and The Things That Matter Most", author: "Rico Tice", copies: 1, shelf: "1", tags: ["Leadership & Pastoral Ministry"] },
  { title: "Foster the Family", author: "Jamie C. Finn", copies: 1, shelf: "1", tags: ["Parenting"] },
  { title: "From Heaven He Came and Sought Her", author: "Gibson & Gibson", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Gentle and Lowly", author: "Dane Ortlund", copies: 1, shelf: "2", tags: ["Christian Living", "Devotionals"] },
  { title: "Go and Do Likewise", author: "Amy Sherman", copies: 1, shelf: "3", tags: ["Christian Living"] },
  { title: "God Took Me by the Hand", author: "Jerry Bridges", copies: 1, shelf: "3", tags: ["Biographies"] },
  { title: "God's Pursuit of Man", author: "A.W. Tozer", copies: 2, shelf: "1", tags: ["Christian Classics"] },
  { title: "Good & Angry", author: "David Powlison", copies: 2, shelf: "1", tags: ["Care & Counseling"] },
  { title: "Gospel Patrons", author: "John Rinehart", copies: 1, shelf: "2", tags: ["Biographies"] },
  { title: "Gospel-Centered Discipleship", author: "Jonathan K. Dodson", copies: 1, shelf: "1", tags: ["Christian Living", "Spiritual Disciplines"] },
  { title: "Hearts of Fire", author: "Voice of the Martyrs", copies: 1, shelf: "2", tags: ["Biographies", "Evangelism & Missions"] },
  { title: "Holiness by Grace", author: "Bryan Chapell", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "Holy Bible (NIV Concordance Study Helps, Textbook Edition)", author: "Various", copies: 1, shelf: "5", tags: ["Bibles"] },
  { title: "How to Talk About Jesus (Without Being That Guy)", author: "Sam Chan", copies: 1, shelf: "5", tags: ["Evangelism & Missions"] },
  { title: "I Believe in God, the Father Almighty", author: "Alister McGrath", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "In His Image", author: "Jen Wilkin", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "Instruments in the Redeemer's Hands", author: "Paul David Tripp", copies: 1, shelf: "1", tags: ["Care & Counseling"] },
  { title: "Is Hell Real?", author: "Dane Ortlund", copies: 2, shelf: "1", tags: ["Theology"] },
  { title: "Is the Commission Still Great?", author: "Steve Richardson", copies: 1, shelf: "5", tags: ["Evangelism & Missions"] },
  { title: "Jesus the King", author: "Timothy Keller", copies: 1, shelf: "2", tags: ["Biblical Studies"] },
  { title: "Jesus' Sermon on the Mount", author: "D.A. Carson", copies: 1, shelf: "4", tags: ["Commentaries", "Biblical Studies"] },
  { title: "Learning Evangelism from Jesus", author: "Jerram Barrs", copies: 1, shelf: "4", tags: ["Evangelism & Missions"] },
  { title: "Let Justice Roll Down", author: "John M. Perkins", copies: 1, shelf: "1", tags: ["Ethnic Harmony", "Biographies"] },
  { title: "Life Together", author: "Dietrich Bonhoeffer", copies: 1, shelf: "1", tags: ["Community", "Christian Classics"] },
  { title: "Living by the Book", author: "Howard G. & William D. Hendricks", copies: 1, shelf: "4", tags: ["Biblical Studies"] },
  { title: "Living the Cross Centered Life", author: "C.J. Mahaney", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "Loving Jesus More", author: "Philip Ryken", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "Marks of the Messenger", author: "J. Mack Stiles", copies: 1, shelf: "1", tags: ["Evangelism & Missions"] },
  { title: "Me, Myself, and Lies", author: "Jennifer Rothschild", copies: 1, shelf: "4", tags: ["Christian Living", "Men & Women"] },
  { title: "Mere Christianity", author: "C.S. Lewis", copies: 1, shelf: "5", tags: ["Apologetics", "Christian Classics"] },
  { title: "Mission Smart", author: "David L. Frazier", copies: 1, shelf: "5", tags: ["Evangelism & Missions"] },
  { title: "Missions (9Marks)", author: "Andy Johnson", copies: 2, shelf: "2", tags: ["Evangelism & Missions", "The Church"] },
  { title: "Missions on Point", author: "David C. Meade", copies: 1, shelf: "2", tags: ["Evangelism & Missions"] },
  { title: "Mother to Son", author: "Jasmine L. Holmes", copies: 1, shelf: "5", tags: ["Parenting", "Ethnic Harmony"] },
  { title: "One Assembly", author: "Jonathan Leeman", copies: 1, shelf: "1", tags: ["The Church"] },
  { title: "Ordinary Greatness: A Life of Elias Boudinot", author: "Andy Farmer", copies: 1, shelf: "1", tags: ["Biographies"] },
  { title: "Parenting First Aid", author: "Marty Machowski", copies: 1, shelf: "1", tags: ["Parenting"] },
  { title: "Pastors and Their Critics", author: "Joel R. Beeke & Nick Thompson", copies: 1, shelf: "1", tags: ["Leadership & Pastoral Ministry"] },
  { title: "Pathway to Freedom", author: "Alistair Begg", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Prince Caspian (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "Prioritizing the Church in Missions", author: "Folmar & Logsdon", copies: 1, shelf: "2", tags: ["Evangelism & Missions", "The Church"] },
  { title: "Psalms (Geneva Series)", author: "Various", copies: 1, shelf: "3", tags: ["Commentaries"] },
  { title: "Reading the Bible Supernaturally", author: "John Piper", copies: 1, shelf: "2", tags: ["Biblical Studies", "Spiritual Disciplines"] },
  { title: "Recovering Biblical Manhood & Womanhood", author: "Piper & Grudem", copies: 1, shelf: "2", tags: ["Men & Women", "Theology"] },
  { title: "Reforming Journalism", author: "Marvin Olasky", copies: 1, shelf: "3", tags: ["Cultural Issues"] },
  { title: "Rejoicing in Christ", author: "Michael Reeves", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Respectable Sins", author: "Jerry Bridges", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "Seeing and Savoring Jesus Christ", author: "John Piper", copies: 2, shelf: "1", tags: ["Devotionals"] },
  { title: "Serving Without Sinking", author: "John Hindley", copies: 2, shelf: "1", tags: ["Christian Living"] },
  { title: "Sound Doctrine (9Marks)", author: "Bobby Jamieson", copies: 1, shelf: "2", tags: ["Theology", "The Church"] },
  { title: "Sovereign Grace Journal: A Passion for the Church (Mar 2023)", author: "Various", copies: 1, shelf: "4", tags: ["Sovereign Grace"] },
  { title: "Sovereign Grace Journal: Evangelism (Dec 2021)", author: "Various", copies: 1, shelf: "4", tags: ["Sovereign Grace", "Evangelism & Missions"] },
  { title: "Sovereign Grace Journal: Our Shared Values (Jun 2022)", author: "Various", copies: 1, shelf: "4", tags: ["Sovereign Grace"] },
  { title: "Sovereign Grace Journal: Our Statement of Faith (Spring 2021)", author: "Various", copies: 1, shelf: "4", tags: ["Sovereign Grace"] },
  { title: "Sovereign Grace Journal: The Books That Shaped Us (Oct 2024)", author: "Various", copies: 1, shelf: "4", tags: ["Sovereign Grace"] },
  { title: "Speaking of Jesus", author: "J. Mack Stiles", copies: 1, shelf: "4", tags: ["Evangelism & Missions"] },
  { title: "Strangers Next Door", author: "J.D. Payne", copies: 1, shelf: "4", tags: ["Evangelism & Missions"] },
  { title: "Strong's Exhaustive Concordance of the Bible (Updated Edition)", author: "James Strong", copies: 1, shelf: "5", tags: ["Biblical Studies"] },
  { title: "Sunday Matters", author: "Paul David Tripp", copies: 1, shelf: "4", tags: ["The Church"] },
  { title: "Surprised by Jesus", author: "Dane Ortlund", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Systematic Theology", author: "Stephen Wellum", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Systematic Theology", author: "Wayne Grudem", copies: 1, shelf: "5", tags: ["Theology"] },
  { title: "Systematic Theology (Second Edition)", author: "Wayne Grudem", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "Take Words With You", author: "Tim Kerr", copies: 1, shelf: "1", tags: ["Spiritual Disciplines"] },
  { title: "Taking God at His Word", author: "Kevin DeYoung", copies: 1, shelf: "3", tags: ["Biblical Studies"] },
  { title: "The Apostles' Creed", author: "Justin S. Holcomb", copies: 1, shelf: "3", tags: ["Theology"] },
  { title: "The Beginner's Guide to the Gift of Prophecy", author: "Jack Deere", copies: 1, shelf: "3", tags: ["Holy Spirit"] },
  { title: "The Book of Church Order of the Sovereign Grace Churches (2025 Edition)", author: "Various", copies: 1, shelf: "5", tags: ["Sovereign Grace", "The Church"] },
  { title: "The Case for Christ", author: "Lee Strobel", copies: 1, shelf: "4", tags: ["Apologetics"] },
  { title: "The Cost of Discipleship", author: "Dietrich Bonhoeffer", copies: 1, shelf: "4", tags: ["Christian Classics", "Christian Living"] },
  { title: "The Discipline of Grace", author: "Jerry Bridges", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "The Four Loves", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics"] },
  { title: "The Freedom of Self-Forgetfulness", author: "Timothy Keller", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "The Gospel (9Marks)", author: "Ray Ortlund", copies: 1, shelf: "2", tags: ["Theology", "The Church"] },
  { title: "The Gospel Comes with a House Key", author: "Rosaria Butterfield", copies: 1, shelf: "4", tags: ["Community", "Evangelism & Missions"] },
  { title: "The Gospel-Centered Life (Leader's Guide)", author: "Thune & Walker", copies: 1, shelf: "5", tags: ["Christian Living"] },
  { title: "The Greener Grass Conspiracy", author: "Stephen Altrogge", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "The Horse and His Boy (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "The Last Battle (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "The Lion, the Witch and the Wardrobe (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "The Magician's Nephew (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "The Man in the Mirror", author: "Patrick Morley", copies: 1, shelf: "5", tags: ["Men & Women"] },
  { title: "The Meaning of Marriage", author: "Timothy Keller", copies: 2, shelf: "1", tags: ["Marriage"] },
  { title: "The New Strong's Expanded Exhaustive Concordance of the Bible", author: "James Strong", copies: 1, shelf: "5", tags: ["Biblical Studies"] },
  { title: "The Peacemaker", author: "Ken Sande", copies: 1, shelf: "2", tags: ["Care & Counseling", "Christian Living"] },
  { title: "The Prodigal God", author: "Timothy Keller", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "The Purpose Driven Life", author: "Rick Warren", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "The Purpose Driven Life (Chinese Edition)", author: "Rick Warren", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "The Quest for Meekness and Quietness of Spirit", author: "Matthew Henry", copies: 1, shelf: "1", tags: ["Christian Classics", "Spiritual Disciplines"] },
  { title: "The Ragamuffin Gospel", author: "Brennan Manning", copies: 1, shelf: "3", tags: ["Christian Living"] },
  { title: "The Reason for God", author: "Timothy Keller", copies: 1, shelf: "2", tags: ["Apologetics"] },
  { title: "The Rise and Triumph of the Modern Self", author: "Carl Trueman", copies: 1, shelf: "2", tags: ["Cultural Issues", "Church History"] },
  { title: "The Silver Chair (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "The Student Bible Dictionary", author: "Karen Dockrey", copies: 1, shelf: "3", tags: ["Biblical Studies"] },
  { title: "The Sword of The Spirit The Word of God", author: "Joy Lamb", copies: 1, shelf: "4", tags: ["Devotionals"] },
  { title: "The Unquenchable Flame", author: "Michael Reeves", copies: 1, shelf: "1", tags: ["Church History"] },
  { title: "The Vision", author: "Rick Joyner", copies: 1, shelf: "1", tags: ["Christian Living"] },
  { title: "The Voyage of the Dawn Treader (Part of Box Set)", author: "C.S. Lewis", copies: 1, shelf: "3", tags: ["Christian Classics", "Children's Books"] },
  { title: "Theology for Ministry", author: "Ferguson & Van Dixhoorn", copies: 1, shelf: "3", tags: ["Theology", "Leadership & Pastoral Ministry"] },
  { title: "This Momentary Marriage", author: "John Piper", copies: 1, shelf: "1", tags: ["Marriage"] },
  { title: "Trapped", author: "Andy Farmer", copies: 1, shelf: "1", tags: ["Care & Counseling"] },
  { title: "True Life: Practical Wisdom from the Book of Ecclesiastes", author: "Carolyn Mahaney, Nicole Mahaney Whitacre", copies: 1, shelf: "1", tags: ["Biblical Studies"] },
  { title: "Trusting God", author: "Jerry Bridges", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "Truth for Life", author: "Alistair Begg", copies: 1, shelf: "2", tags: ["Devotionals"] },
  { title: "Understanding the Great Commission", author: "Mark Dever", copies: 1, shelf: "1", tags: ["Evangelism & Missions"] },
  { title: "What is Saving Faith?", author: "John Piper", copies: 1, shelf: "2", tags: ["Theology"] },
  { title: 'When Sinners Say "I Do"', author: "Dave Harvey", copies: 1, shelf: "1", tags: ["Marriage"] },
  { title: "Who is an Evangelical?", author: "Thomas S. Kidd", copies: 1, shelf: "5", tags: ["Church History"] },
  { title: "Witness", author: "Darren Carlson", copies: 1, shelf: "2", tags: ["Evangelism & Missions"] },
  { title: "Worldliness", author: "C.J. Mahaney", copies: 1, shelf: "4", tags: ["Christian Living"] },
  { title: "You and Me Forever", author: "Francis Chan & Lisa Chan", copies: 1, shelf: "1", tags: ["Marriage"] },
  { title: "\u5723\u7ecf / Holy Bible (Chinese/English New Translation)", author: "Various", copies: 3, shelf: "5", tags: ["Bibles"] },
  { title: "\u8bf4\u7985\u8bba\u9053 (Discussing Zen and the Way)", author: "\u5e84\u7956\u9cb2 (Zhuang Zukun)", copies: 1, shelf: "5", tags: ["Apologetics"] },
];

async function main() {
  const managerPassword = await hash("admin123", 12);
  const memberPassword = await hash("member123", 12);

  const manager = await prisma.user.upsert({
    where: { email: "admin@library.com" },
    update: {},
    create: {
      email: "admin@library.com",
      name: "Library Manager",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@library.com" },
    update: {},
    create: {
      email: "member@library.com",
      name: "Jane Reader",
      passwordHash: memberPassword,
      role: "MEMBER",
    },
  });

  const tagMap = new Map<string, string>();
  for (const tagDef of tagDefinitions) {
    const tag = await prisma.tag.upsert({
      where: { name: tagDef.name },
      update: { color: tagDef.color },
      create: tagDef,
    });
    tagMap.set(tag.name, tag.id);
  }

  let barcodeCounter = 1;

  for (const book of books) {
    const copies = Array.from({ length: book.copies }, () => {
      const barcode = `LIB-${String(barcodeCounter++).padStart(6, "0")}`;
      return { barcode, status: "AVAILABLE" as const, location: `Shelf ${book.shelf}` };
    });

    const tagConnections = book.tags
      .map((tagName) => tagMap.get(tagName))
      .filter((id): id is string => !!id)
      .map((tagId) => ({ tagId }));

    await prisma.resource.create({
      data: {
        title: book.title,
        author: book.author,
        type: "BOOK",
        copies: { create: copies },
        tags: { create: tagConnections },
      },
    });
  }

  const usedTags = new Set(books.flatMap((b) => b.tags));
  console.log(`Seed complete: ${books.length} books, ${barcodeCounter - 1} total copies`);
  console.log(`Tags created: ${usedTags.size} (${[...usedTags].sort().join(", ")})`);
  console.log(`Accounts: ${manager.email} (manager), ${member.email} (member)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
