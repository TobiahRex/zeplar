import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import type { Implementation } from "@/data/schema";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface TechComparisonProps {
  implementations: Implementation[];
  patternName: string;
}

export function TechComparison({
  implementations,
  patternName,
}: TechComparisonProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!implementations || implementations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No technology implementations documented yet for {patternName}.
        </CardContent>
      </Card>
    );
  }

  // Get unique types and languages for filtering
  const types = ["all", ...new Set(implementations.map((impl) => impl.type))];
  const allLanguages = new Set<string>();
  implementations.forEach((impl) => {
    impl.languages.forEach((lang) => allLanguages.add(lang));
  });
  const languages = ["all", ...Array.from(allLanguages)];

  // Filter implementations
  const filteredImplementations = implementations.filter((impl) => {
    const typeMatch = selectedType === "all" || impl.type === selectedType;
    const langMatch =
      selectedLanguage === "all" || impl.languages.includes(selectedLanguage);
    return typeMatch && langMatch;
  });

  // Toggle expansion for code snippets
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Determine primary comparison implementations (top 3-5)
  const primaryImplementations = implementations.slice(0, 5);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grid">Card View</TabsTrigger>
          <TabsTrigger value="table">Comparison Table</TabsTrigger>
        </TabsList>

        {/* Card Grid View */}
        <TabsContent value="grid" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <span className="text-sm text-muted-foreground self-center mr-2">
                Type:
              </span>
              {types.map((type) => (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>

            <div className="flex gap-1">
              <span className="text-sm text-muted-foreground self-center mr-2">
                Language:
              </span>
              {languages.map((lang) => (
                <Badge
                  key={lang}
                  variant={selectedLanguage === lang ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedLanguage(lang)}
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>

          {/* Implementation Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredImplementations.map((impl) => {
              const isExpanded = expandedIds.has(impl.id);

              return (
                <Card key={impl.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{impl.name}</CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {impl.type}
                      </Badge>
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {impl.languages.map((lang, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {impl.description}
                    </p>

                    {/* Links */}
                    <div className="flex gap-2 flex-wrap">
                      {impl.links.docs && (
                        <a
                          href={impl.links.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Docs
                        </a>
                      )}
                      {impl.links.github && (
                        <a
                          href={impl.links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          GitHub
                        </a>
                      )}
                      {impl.links.npm && (
                        <a
                          href={impl.links.npm}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          npm
                        </a>
                      )}
                    </div>

                    {/* Code snippet toggle */}
                    {impl.codeSnippet && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpanded(impl.id)}
                          className="w-full"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Hide Code Example
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              Show Code Example
                            </>
                          )}
                        </Button>

                        {isExpanded && (
                          <div className="mt-3">
                            <CodeMirror
                              value={impl.codeSnippet}
                              extensions={[
                                javascript({ jsx: true, typescript: true }),
                              ]}
                              editable={false}
                              basicSetup={{
                                lineNumbers: true,
                                foldGutter: false,
                                highlightActiveLineGutter: false,
                              }}
                              className="text-sm border rounded"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredImplementations.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No implementations match the selected filters.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comparison Table View */}
        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold">
                        Name
                      </th>
                      <th className="p-3 text-left text-sm font-semibold">
                        Type
                      </th>
                      <th className="p-3 text-left text-sm font-semibold">
                        Languages
                      </th>
                      <th className="p-3 text-left text-sm font-semibold">
                        Description
                      </th>
                      <th className="p-3 text-left text-sm font-semibold">
                        Links
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {primaryImplementations.map((impl, idx) => (
                      <tr
                        key={impl.id}
                        className={idx % 2 === 0 ? "bg-muted/20" : ""}
                      >
                        <td className="p-3 font-medium">{impl.name}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="capitalize">
                            {impl.type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {impl.languages.map((lang, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground max-w-md">
                          {impl.description}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {impl.links.docs && (
                              <a
                                href={impl.links.docs}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                Docs
                              </a>
                            )}
                            {impl.links.github && (
                              <a
                                href={impl.links.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                GitHub
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
