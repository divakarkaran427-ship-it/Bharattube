import { FaCircleQuestion } from "react-icons/fa6";
import "./Help.css";

const topics = [
  ["Watching videos", "Use Watch History to resume unfinished videos and manage what you watched."],
  ["Playlists", "Create a playlist from Your Playlists, then use Save on a video to organize it."],
  ["Notifications", "The bell shows new likes, comments, subscribers, and uploads from channels you follow."],
  ["Account preferences", "Use Settings to select your BharatTube color theme and preferred language."],
];

function Help() {
  return <main className="help-page"><header><p><FaCircleQuestion aria-hidden="true" /> Support</p><h1>Help Center</h1><span>Quick answers for using BharatTube.</span></header><section className="help-topics">{topics.map(([title, description]) => <article key={title}><h2>{title}</h2><p>{description}</p></article>)}</section></main>;
}

export default Help;
