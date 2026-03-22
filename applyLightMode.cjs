const fs = require("fs");
let content = fs.readFileSync("views/Inicio03.tsx", "utf-8");

// Regex to specifically target className strings
content = content.replace(/className="([^"]+)"/g, (match, classStr) => {
    let classes = classStr.split(" ");
    let newClasses = [];
    
    for (const cls of classes) {
        if (!cls) continue;
        
        switch (cls) {
            case "bg-[#121212]": newClasses.push("bg-white", "dark:bg-[#121212]"); break;
            case "bg-[#141414]": newClasses.push("bg-gray-50", "dark:bg-[#141414]"); break;
            case "bg-[#1A1A1A]":
            case "bg-[#1A1E24]":
            case "bg-[#16131D]":
            case "bg-[#1A1624]":
            case "bg-[#0E0E0E]":
                 newClasses.push("bg-white", `dark:${cls}`); break;
            case "bg-[#2A2A2A]": newClasses.push("bg-gray-100", "dark:bg-[#2A2A2A]"); break;
            case "border-[#202020]": newClasses.push("border-gray-200", "dark:border-[#202020]"); break;
            case "border-[#252525]": newClasses.push("border-gray-200", "dark:border-[#252525]"); break;
            case "border-[#2A2A2A]": newClasses.push("border-gray-200", "dark:border-[#2A2A2A]"); break;
            case "border-[#3A3A3A]": newClasses.push("border-gray-300", "dark:border-[#3A3A3A]"); break;
            case "border-[#4A4A4A]": newClasses.push("border-gray-400", "dark:border-[#4A4A4A]"); break;
            case "hover:bg-[#3A3A3A]": newClasses.push("hover:bg-gray-200", "dark:hover:bg-[#3A3A3A]"); break;
            case "hover:border-[#3A3A3A]": newClasses.push("hover:border-gray-300", "dark:hover:border-[#3A3A3A]"); break;
            case "hover:border-[#4A4A4A]": newClasses.push("hover:border-gray-400", "dark:hover:border-[#4A4A4A]"); break;
            case "text-white": newClasses.push("text-gray-900", "dark:text-white"); break;
            case "text-[#121212]": newClasses.push("text-white", "dark:text-[#121212]"); break;
            case "text-gray-400": newClasses.push("text-gray-600", "dark:text-gray-400"); break;
            case "text-gray-500": newClasses.push("text-gray-500", "dark:text-gray-500"); break;
            default: newClasses.push(cls);
        }
    }
    return `className="${newClasses.join(" ")}"`;
});

fs.writeFileSync("views/Inicio03.tsx", content);
console.log("Light mode classes applied successfully.");

