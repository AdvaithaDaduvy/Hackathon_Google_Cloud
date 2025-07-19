from google.adk.agents import LlmAgent
from dotenv import load_dotenv
import os
from google.adk.agents import Agent
from .sub_agents.disease_agent.agent import disease_agent
from .sub_agents.market_agent.agent import market_agent
from .sub_agents.scheme_agent.agent import scheme_agent
 



root_agent = Agent(
    name="k",
    model="gemini-2.5-flash",
    description="I am a farming assistant that helps with agricultural queries and routes disease-related questions to specialists.",
    instruction="""
    You are Kisaan Saathi, a helpful farming assistant. Your role is to:
    
    1. Help farmers with general agricultural questions
    2. Route disease-related queries to the Disease Detection Agent
    3. Provide farming advice and guidance
    
    When a farmer asks about plant diseases, symptoms, or treatment, transfer them to the Disease Detection Agent.
    For other farming questions, provide helpful general advice.
    
    Always be helpful, practical, and considerate of the farmer's needs.
    """,
    sub_agents=[disease_agent, market_agent, scheme_agent],
   
)